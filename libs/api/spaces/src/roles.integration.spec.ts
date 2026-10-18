import { ConflictException, NotFoundException } from '@nestjs/common';
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
import { RolesService } from './roles.service';
import { SpacesService } from './spaces.service';

const serverRoot = resolve(import.meta.dirname, '../../../../apps/server');
config({
  path: [resolve(serverRoot, '.env.local'), resolve(serverRoot, '.env')],
  quiet: true,
});

const describeDb = process.env.DATABASE_URL ? describe : describe.skip;

describeDb('RolesService + RLS (DB)', () => {
  let prisma: PrismaService;
  let spaces: SpacesService;
  let roles: RolesService;
  let spaceGuard: SpaceGuard;

  const ownerId = randomUUID();
  const adminId = randomUUID();
  const outsiderId = randomUUID();
  let spaceAId = '';
  let spaceBId = '';
  const slugA = `roles-a-${Date.now().toString(36)}`;
  const slugB = `roles-b-${Date.now().toString(36)}`;

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
      providers: [SpacesService, RolesService, SpaceGuard],
    }).compile();

    prisma = moduleRef.get(PrismaService);
    spaces = moduleRef.get(SpacesService);
    roles = moduleRef.get(RolesService);
    spaceGuard = moduleRef.get(SpaceGuard);
    await prisma.$connect();

    await prisma.user.createMany({
      data: [
        {
          id: ownerId,
          name: 'Roles Owner',
          email: `roles-owner-${ownerId}@workhub.test`,
          emailVerified: true,
        },
        {
          id: adminId,
          name: 'Roles Admin',
          email: `roles-admin-${adminId}@workhub.test`,
          emailVerified: true,
        },
        {
          id: outsiderId,
          name: 'Roles Outsider',
          email: `roles-out-${outsiderId}@workhub.test`,
          emailVerified: true,
        },
      ],
    });

    spaceAId = (
      await spaces.create(ownerId, { name: 'Roles A', slug: slugA })
    ).id;
    spaceBId = (
      await spaces.create(outsiderId, { name: 'Roles B', slug: slugB })
    ).id;

    await prisma.withTenant({ userId: ownerId, spaceId: spaceAId }, async (tx) => {
      const adminRole = await tx.role.findFirstOrThrow({
        where: { spaceId: spaceAId, name: SYSTEM_ROLE_NAMES.ADMIN },
      });
      await tx.membership.create({
        data: {
          spaceId: spaceAId,
          userId: adminId,
          roleId: adminRole.id,
        },
      });
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('lists roles including Owner and supports custom role CRUD', async () => {
    const ownerAccess = await loadAccess(spaceAId, ownerId);
    const listed = await roles.list(ownerAccess);
    expect(listed.items.some((r) => r.name === SYSTEM_ROLE_NAMES.OWNER)).toBe(
      true
    );
    expect(listed.items.some((r) => r.isDefault)).toBe(true);

    const created = await roles.create(ownerAccess, {
      name: 'Lead',
      permissions: [PERMISSIONS.MEMBERS_READ, PERMISSIONS.CALENDAR_READ],
    });
    expect(created.isSystem).toBe(false);
    expect(created.memberCount).toBe(0);

    const updated = await roles.update(ownerAccess, created.id, {
      name: 'Team Lead',
      isDefault: true,
    });
    expect(updated.name).toBe('Team Lead');
    expect(updated.isDefault).toBe(true);

    // Clear default by pointing it back to Member, then delete.
    const memberRole = listed.items.find(
      (r) => r.name === SYSTEM_ROLE_NAMES.MEMBER
    );
    if (!memberRole) {
      throw new Error('Member role missing');
    }
    await roles.update(ownerAccess, memberRole.id, { isDefault: true });
    await roles.delete(ownerAccess, created.id);

    const after = await roles.list(ownerAccess);
    expect(after.items.some((r) => r.id === created.id)).toBe(false);
  });

  it('enforces Owner lock, escalation, and cross-workspace 404', async () => {
    const adminAccess = await loadAccess(spaceAId, adminId);
    const ownerAccess = await loadAccess(spaceAId, ownerId);

    const listed = await roles.list(ownerAccess);
    const ownerRole = listed.items.find(
      (r) => r.name === SYSTEM_ROLE_NAMES.OWNER
    );
    const adminRole = listed.items.find(
      (r) => r.name === SYSTEM_ROLE_NAMES.ADMIN
    );
    if (!ownerRole || !adminRole) {
      throw new Error('system roles missing');
    }

    await expect(
      roles.update(adminAccess, ownerRole.id, {
        permissions: [PERMISSIONS.MEMBERS_READ],
      })
    ).rejects.toMatchObject({
      response: { code: ErrorCode.SYSTEM_ROLE_LOCKED },
    });

    await expect(
      roles.create(adminAccess, {
        name: 'Escalated',
        permissions: [PERMISSIONS.SPACE_DELETE],
      })
    ).rejects.toMatchObject({
      response: { code: ErrorCode.ROLE_ESCALATION },
    });

    const spaceBOwnerRoleId = await prisma.withTenant(
      { userId: outsiderId, spaceId: spaceBId },
      async (tx) => {
        const role = await tx.role.findFirstOrThrow({
          where: { spaceId: spaceBId, name: SYSTEM_ROLE_NAMES.OWNER },
          select: { id: true },
        });
        return role.id;
      }
    );

    await expect(
      roles.update(adminAccess, spaceBOwnerRoleId, {
        permissions: [PERMISSIONS.MEMBERS_READ],
      })
    ).rejects.toBeInstanceOf(NotFoundException);

    // RLS: writing a role row under the wrong tenant space id must fail.
    await expect(
      prisma.withTenant({ userId: adminId, spaceId: spaceAId }, (tx) =>
        tx.role.create({
          data: {
            spaceId: spaceBId,
            name: 'CrossTenant',
            permissions: [PERMISSIONS.MEMBERS_READ],
            isSystem: false,
          },
        })
      )
    ).rejects.toThrow();
  });

  it('returns ROLE_IN_USE when members still hold the role', async () => {
    const ownerAccess = await loadAccess(spaceAId, ownerId);
    const created = await roles.create(ownerAccess, {
      name: 'Temp Role',
      permissions: [PERMISSIONS.MEMBERS_READ],
    });

    await prisma.withTenant({ userId: ownerId, spaceId: spaceAId }, async (tx) => {
      await tx.membership.updateMany({
        where: { spaceId: spaceAId, userId: adminId },
        data: { roleId: created.id },
      });
    });

    await expect(roles.delete(ownerAccess, created.id)).rejects.toMatchObject({
      response: { code: ErrorCode.ROLE_IN_USE },
    });

    // Restore admin so cleanup / other tests stay sane.
    await prisma.withTenant({ userId: ownerId, spaceId: spaceAId }, async (tx) => {
      const adminRole = await tx.role.findFirstOrThrow({
        where: { spaceId: spaceAId, name: SYSTEM_ROLE_NAMES.ADMIN },
      });
      await tx.membership.updateMany({
        where: { spaceId: spaceAId, userId: adminId },
        data: { roleId: adminRole.id },
      });
    });
    await roles.delete(ownerAccess, created.id);
  });

  it('forbids deleting system roles', async () => {
    const ownerAccess = await loadAccess(spaceAId, ownerId);
    const listed = await roles.list(ownerAccess);
    const memberRole = listed.items.find(
      (r) => r.name === SYSTEM_ROLE_NAMES.MEMBER
    );
    if (!memberRole) {
      throw new Error('Member role missing');
    }

    await expect(roles.delete(ownerAccess, memberRole.id)).rejects.toMatchObject(
      {
        response: { code: ErrorCode.SYSTEM_ROLE_LOCKED },
      }
    );
  });

  it('blocks clearing the default without a replacement', async () => {
    const ownerAccess = await loadAccess(spaceAId, ownerId);
    const listed = await roles.list(ownerAccess);
    const defaultRole = listed.items.find((r) => r.isDefault);
    if (!defaultRole) {
      throw new Error('default role missing');
    }

    await expect(
      roles.update(ownerAccess, defaultRole.id, { isDefault: false })
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
