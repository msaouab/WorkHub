import {
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import {
  RequirePermissionGuard,
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
import { MembersService } from './members.service';
import { SpacesService } from './spaces.service';

const serverRoot = resolve(import.meta.dirname, '../../../../apps/server');
config({
  path: [resolve(serverRoot, '.env.local'), resolve(serverRoot, '.env')],
  quiet: true,
});

const describeDb = process.env.DATABASE_URL ? describe : describe.skip;

describeDb('MembersService + SpaceGuard (DB)', () => {
  let prisma: PrismaService;
  let spaces: SpacesService;
  let members: MembersService;
  let spaceGuard: SpaceGuard;

  const ownerId = randomUUID();
  const adminId = randomUUID();
  const memberId = randomUUID();
  const outsiderId = randomUUID();
  let spaceAId = '';
  let spaceBId = '';
  let ownerMembershipId = '';
  let adminMembershipId = '';
  let memberMembershipId = '';
  let spaceBOwnerMembershipId = '';
  const slugA = `mem-a-${Date.now().toString(36)}`;
  const slugB = `mem-b-${Date.now().toString(36)}`;

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

  function assertMembersRead(access: SpaceAccess) {
    const guard = new RequirePermissionGuard({
      getAllAndOverride: () => PERMISSIONS.MEMBERS_READ,
    } as unknown as Reflector);
    const request = { [SPACE_ACCESS_KEY]: access };
    return guard.canActivate({
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as never);
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
      providers: [SpacesService, MembersService, SpaceGuard],
    }).compile();

    prisma = moduleRef.get(PrismaService);
    spaces = moduleRef.get(SpacesService);
    members = moduleRef.get(MembersService);
    spaceGuard = moduleRef.get(SpaceGuard);
    await prisma.$connect();

    await prisma.user.createMany({
      data: [
        {
          id: ownerId,
          name: 'Members Owner',
          email: `mem-owner-${ownerId}@workhub.test`,
          emailVerified: true,
        },
        {
          id: adminId,
          name: 'Members Admin',
          email: `mem-admin-${adminId}@workhub.test`,
          emailVerified: true,
        },
        {
          id: memberId,
          name: 'Zed Member',
          email: `mem-member-${memberId}@workhub.test`,
          emailVerified: true,
        },
        {
          id: outsiderId,
          name: 'Outsider',
          email: `mem-out-${outsiderId}@workhub.test`,
          emailVerified: true,
        },
      ],
    });

    spaceAId = (
      await spaces.create(ownerId, { name: 'Members A', slug: slugA })
    ).id;
    spaceBId = (
      await spaces.create(outsiderId, { name: 'Members B', slug: slugB })
    ).id;

    await prisma.withTenant({ userId: ownerId, spaceId: spaceAId }, async (tx) => {
      const roles = await tx.role.findMany({ where: { spaceId: spaceAId } });
      const adminRole = roles.find((r) => r.name === SYSTEM_ROLE_NAMES.ADMIN);
      const memberRole = roles.find((r) => r.name === SYSTEM_ROLE_NAMES.MEMBER);
      if (!adminRole || !memberRole) {
        throw new Error('system roles missing');
      }

      const ownerMembership = await tx.membership.findUniqueOrThrow({
        where: {
          spaceId_userId: { spaceId: spaceAId, userId: ownerId },
        },
      });
      ownerMembershipId = ownerMembership.id;

      const adminMembership = await tx.membership.create({
        data: {
          spaceId: spaceAId,
          userId: adminId,
          roleId: adminRole.id,
        },
      });
      adminMembershipId = adminMembership.id;

      const memberMembership = await tx.membership.create({
        data: {
          spaceId: spaceAId,
          userId: memberId,
          roleId: memberRole.id,
        },
      });
      memberMembershipId = memberMembership.id;
    });

    await prisma.withTenant(
      { userId: outsiderId, spaceId: spaceBId },
      async (tx) => {
        const membership = await tx.membership.findUniqueOrThrow({
          where: {
            spaceId_userId: { spaceId: spaceBId, userId: outsiderId },
          },
        });
        spaceBOwnerMembershipId = membership.id;
      }
    );
  });

  afterAll(async () => {
    if (!prisma) {
      return;
    }
    for (const [userId, spaceId] of [
      [ownerId, spaceAId],
      [outsiderId, spaceBId],
    ] as const) {
      if (!spaceId) {
        continue;
      }
      await prisma
        .withTenant({ userId, spaceId }, (tx) =>
          tx.space.delete({ where: { id: spaceId } })
        )
        .catch(() => undefined);
    }
    await prisma.user.deleteMany({
      where: { id: { in: [ownerId, adminId, memberId, outsiderId] } },
    });
    await prisma.$disconnect();
  });

  it('lists members with cursor pages and search', async () => {
    const access = await loadAccess(spaceAId, ownerId);

    const first = await members.list(access, { limit: 2 });
    expect(first.items).toHaveLength(2);
    expect(first.nextCursor).toBeTruthy();

    const second = await members.list(access, {
      limit: 2,
      cursor: first.nextCursor ?? undefined,
    });
    expect(second.items.length).toBeGreaterThanOrEqual(1);
    expect(
      [...first.items, ...second.items].map((m) => m.id)
    ).toEqual(
      expect.arrayContaining([
        ownerMembershipId,
        adminMembershipId,
        memberMembershipId,
      ])
    );

    const searched = await members.list(access, { limit: 20, q: 'Zed' });
    expect(searched.items).toHaveLength(1);
    expect(searched.items[0]?.userId).toBe(memberId);
  });

  it('forbids members.read when the role lacks it', async () => {
    let previous: string[] = [];
    await prisma.withTenant({ userId: ownerId, spaceId: spaceAId }, async (tx) => {
      const role = await tx.role.findFirstOrThrow({
        where: { spaceId: spaceAId, name: SYSTEM_ROLE_NAMES.MEMBER },
      });
      previous = role.permissions;
      await tx.role.update({
        where: { id: role.id },
        data: { permissions: [] },
      });
    });

    try {
      const access = await loadAccess(spaceAId, memberId);
      expect(access.permissions).not.toContain(PERMISSIONS.MEMBERS_READ);
      expect(() => assertMembersRead(access)).toThrow(ForbiddenException);
    } finally {
      await prisma.withTenant(
        { userId: ownerId, spaceId: spaceAId },
        async (tx) => {
          const role = await tx.role.findFirstOrThrow({
            where: { spaceId: spaceAId, name: SYSTEM_ROLE_NAMES.MEMBER },
          });
          await tx.role.update({
            where: { id: role.id },
            data: { permissions: previous },
          });
        }
      );
    }
  });

  it('deactivated membership is rejected by SpaceGuard on the next load', async () => {
    const adminAccess = await loadAccess(spaceAId, adminId);
    await members.deactivate(adminAccess, memberMembershipId);

    await expect(loadAccess(spaceAId, memberId)).rejects.toBeInstanceOf(
      ForbiddenException
    );

    await members.reactivate(adminAccess, memberMembershipId);
    await expect(loadAccess(spaceAId, memberId)).resolves.toMatchObject({
      userId: memberId,
      membershipStatus: 'active',
    });
  });

  it('returns 404 for cross-tenant membership ids', async () => {
    const adminAccess = await loadAccess(spaceAId, adminId);

    await expect(
      members.deactivate(adminAccess, spaceBOwnerMembershipId)
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      members.remove(adminAccess, spaceBOwnerMembershipId)
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('enforces owner / self / last-owner safety against the DB', async () => {
    const adminAccess = await loadAccess(spaceAId, adminId);
    const ownerAccess = await loadAccess(spaceAId, ownerId);

    await expect(
      members.deactivate(adminAccess, ownerMembershipId)
    ).rejects.toMatchObject({
      response: { code: ErrorCode.CANNOT_MODIFY_OWNER },
    });
    await expect(
      members.deactivate(adminAccess, adminMembershipId)
    ).rejects.toMatchObject({
      response: { code: ErrorCode.CANNOT_DEACTIVATE_SELF },
    });
    await expect(
      members.remove(adminAccess, adminMembershipId)
    ).rejects.toMatchObject({
      response: { code: ErrorCode.CANNOT_REMOVE_SELF },
    });
    await expect(members.leave(ownerAccess)).rejects.toMatchObject({
      response: { code: ErrorCode.LAST_OWNER },
    });
  });

  it('lets a member leave the workspace', async () => {
    const leaveUserId = randomUUID();
    await prisma.user.create({
      data: {
        id: leaveUserId,
        name: 'Leave Me',
        email: `mem-leave-${leaveUserId}@workhub.test`,
        emailVerified: true,
      },
    });

    let leaveMembershipId = '';
    await prisma.withTenant({ userId: ownerId, spaceId: spaceAId }, async (tx) => {
      const memberRole = await tx.role.findFirstOrThrow({
        where: { spaceId: spaceAId, name: SYSTEM_ROLE_NAMES.MEMBER },
      });
      const created = await tx.membership.create({
        data: {
          spaceId: spaceAId,
          userId: leaveUserId,
          roleId: memberRole.id,
        },
      });
      leaveMembershipId = created.id;
    });

    const leaveAccess = await loadAccess(spaceAId, leaveUserId);
    await members.leave(leaveAccess);

    await expect(loadAccess(spaceAId, leaveUserId)).rejects.toBeInstanceOf(
      NotFoundException
    );

    await prisma.user.delete({ where: { id: leaveUserId } }).catch(() => undefined);
    expect(leaveMembershipId).toBeTruthy();
  });
});
