import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import {
  SPACE_ACCESS_KEY,
  SpaceGuard,
  type SpaceAccess,
} from '@work-hub/access';
import {
  ErrorCode,
  PERMISSIONS,
  SYSTEM_ROLE_NAMES,
} from '@work-hub/constants';
import { DatabaseModule, PrismaService } from '@work-hub/database';
import { StorageModule } from '@work-hub/storage';
import { config } from 'dotenv';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SpacesService } from './spaces.service';
import { TeamsService } from './teams.service';

const serverRoot = resolve(import.meta.dirname, '../../../../apps/server');
config({
  path: [resolve(serverRoot, '.env.local'), resolve(serverRoot, '.env')],
  quiet: true,
});

const describeDb = process.env.DATABASE_URL ? describe : describe.skip;

describeDb('TeamsService + RLS (DB)', () => {
  let prisma: PrismaService;
  let spaces: SpacesService;
  let teams: TeamsService;
  let spaceGuard: SpaceGuard;

  const ownerId = randomUUID();
  const memberId = randomUUID();
  const outsiderId = randomUUID();
  let spaceAId = '';
  let spaceBId = '';
  let ownerMembershipId = '';
  let memberMembershipId = '';
  const slugA = `teams-a-${Date.now().toString(36)}`;
  const slugB = `teams-b-${Date.now().toString(36)}`;

  async function loadAccess(
    spaceId: string,
    userId: string
  ): Promise<SpaceAccess> {
    const request: Record<string, unknown> = {
      params: { spaceId },
      user: { id: userId },
    };
    await spaceGuard.canActivate({
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as never);
    return request[SPACE_ACCESS_KEY] as SpaceAccess;
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          cache: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              databaseUrl: process.env.DATABASE_URL,
              storage: {
                endpoint:
                  process.env.STORAGE_ENDPOINT ?? 'http://localhost:9000',
                region: process.env.STORAGE_REGION ?? 'us-east-1',
                bucket: process.env.STORAGE_BUCKET ?? 'workhub',
                accessKeyId: process.env.STORAGE_ACCESS_KEY ?? 'workhub',
                secretAccessKey:
                  process.env.STORAGE_SECRET_KEY ?? 'workhubsecret',
                publicBaseUrl:
                  process.env.STORAGE_PUBLIC_BASE_URL ??
                  'http://localhost:9000/workhub',
                forcePathStyle: true,
              },
            }),
          ],
        }),
        DatabaseModule,
        StorageModule,
      ],
      providers: [SpacesService, TeamsService, SpaceGuard],
    }).compile();

    prisma = moduleRef.get(PrismaService);
    spaces = moduleRef.get(SpacesService);
    teams = moduleRef.get(TeamsService);
    spaceGuard = moduleRef.get(SpaceGuard);
    await prisma.$connect();

    await prisma.user.createMany({
      data: [
        {
          id: ownerId,
          name: 'Teams Owner',
          email: `teams-owner-${ownerId}@workhub.test`,
          emailVerified: true,
        },
        {
          id: memberId,
          name: 'Teams Member',
          email: `teams-member-${memberId}@workhub.test`,
          emailVerified: true,
        },
        {
          id: outsiderId,
          name: 'Teams Outsider',
          email: `teams-out-${outsiderId}@workhub.test`,
          emailVerified: true,
        },
      ],
    });

    spaceAId = (
      await spaces.create(ownerId, { name: 'Teams A', slug: slugA })
    ).id;
    spaceBId = (
      await spaces.create(outsiderId, { name: 'Teams B', slug: slugB })
    ).id;

    await prisma.withTenant(
      { userId: ownerId, spaceId: spaceAId },
      async (tx) => {
        const memberRole = await tx.role.findFirstOrThrow({
          where: { spaceId: spaceAId, name: SYSTEM_ROLE_NAMES.MEMBER },
        });
        const managerRole = await tx.role.findFirstOrThrow({
          where: { spaceId: spaceAId, name: SYSTEM_ROLE_NAMES.MANAGER },
        });
        expect(managerRole.permissions).toContain(PERMISSIONS.LEAVE_APPROVE);

        const ownerMembership = await tx.membership.findFirstOrThrow({
          where: { spaceId: spaceAId, userId: ownerId },
        });
        ownerMembershipId = ownerMembership.id;

        const created = await tx.membership.create({
          data: {
            spaceId: spaceAId,
            userId: memberId,
            roleId: memberRole.id,
          },
        });
        memberMembershipId = created.id;
      }
    );
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('supports group CRUD with members and managers', async () => {
    const ownerAccess = await loadAccess(spaceAId, ownerId);

    const created = await teams.create(ownerAccess, {
      name: 'Engineering',
      memberIds: [memberMembershipId],
      managerIds: [ownerMembershipId],
    });
    expect(created.name).toBe('Engineering');
    expect(created.members.map((m) => m.membershipId)).toEqual([
      memberMembershipId,
    ]);
    expect(created.managers.map((m) => m.membershipId)).toEqual([
      ownerMembershipId,
    ]);

    const listed = await teams.list(ownerAccess);
    expect(listed.items.some((t) => t.id === created.id)).toBe(true);

    const renamed = await teams.update(ownerAccess, created.id, {
      name: 'Platform',
      memberIds: [memberMembershipId, ownerMembershipId],
      managerIds: [ownerMembershipId],
    });
    expect(renamed.name).toBe('Platform');
    expect(renamed.members).toHaveLength(2);
    expect(renamed.managers.map((m) => m.membershipId)).toEqual([
      ownerMembershipId,
    ]);

    await expect(
      teams.update(ownerAccess, created.id, {
        managerIds: [memberMembershipId],
      })
    ).rejects.toMatchObject({
      response: { code: ErrorCode.VALIDATION_FAILED },
    });

    await teams.delete(ownerAccess, created.id);
    const after = await teams.list(ownerAccess);
    expect(after.items.some((t) => t.id === created.id)).toBe(false);
  });

  it('rejects duplicate names and cross-workspace team ids', async () => {
    const ownerAccess = await loadAccess(spaceAId, ownerId);
    const outsiderAccess = await loadAccess(spaceBId, outsiderId);

    const created = await teams.create(ownerAccess, { name: 'Unique Group' });

    await expect(
      teams.create(ownerAccess, { name: 'Unique Group' })
    ).rejects.toMatchObject({
      response: { code: ErrorCode.TEAM_NAME_TAKEN },
    });

    await expect(
      teams.update(outsiderAccess, created.id, { name: 'Stolen' })
    ).rejects.toMatchObject({
      response: { code: ErrorCode.NOT_FOUND },
    });

    await teams.delete(ownerAccess, created.id);
  });

  it('hides teams from other workspaces via RLS', async () => {
    const ownerAccess = await loadAccess(spaceAId, ownerId);
    const created = await teams.create(ownerAccess, { name: 'Private A' });

    const leaked = await prisma.withTenant(
      { userId: outsiderId, spaceId: spaceBId },
      (tx) => tx.team.findMany({ where: { id: created.id } })
    );
    expect(leaked).toEqual([]);

    await teams.delete(ownerAccess, created.id);
  });
});
