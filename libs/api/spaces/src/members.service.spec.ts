import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  ErrorCode,
  PERMISSIONS,
  SYSTEM_ROLE_NAMES,
} from '@work-hub/constants';
import type { PrismaService } from '@work-hub/database';
import { describe, expect, it, vi } from 'vitest';
import { MembersService } from './members.service';

const spaceId = '01936b3c-0000-7000-8000-0000000000aa';
const actorId = '01936b3c-0000-7000-8000-0000000000bb';
const memberUserId = '01936b3c-0000-7000-8000-0000000000cc';
const membershipId = '01936b3c-0000-7000-8000-0000000000dd';
const ownerMembershipId = '01936b3c-0000-7000-8000-0000000000ee';
const adminRoleId = '01936b3c-0000-7000-8000-0000000000a1';
const memberRoleId = '01936b3c-0000-7000-8000-0000000000a2';
const ownerRoleId = '01936b3c-0000-7000-8000-0000000000a3';

const access = {
  spaceId,
  userId: actorId,
  membershipId: '01936b3c-0000-7000-8000-0000000000ff',
  membershipStatus: 'active' as const,
  roleId: adminRoleId,
  roleName: SYSTEM_ROLE_NAMES.ADMIN,
  permissions: [
    PERMISSIONS.MEMBERS_READ,
    PERMISSIONS.MEMBERS_WRITE,
    PERMISSIONS.ROLES_WRITE,
    PERMISSIONS.INVITES_WRITE,
  ],
};

function memberRow(overrides: Record<string, unknown> = {}) {
  return {
    id: membershipId,
    userId: memberUserId,
    status: 'active' as const,
    createdAt: new Date('2026-10-17T12:00:00.000Z'),
    user: {
      id: memberUserId,
      name: 'Mia Member',
      email: 'member@workhub.test',
      image: null,
    },
    role: {
      id: memberRoleId,
      name: SYSTEM_ROLE_NAMES.MEMBER,
      permissions: [PERMISSIONS.MEMBERS_READ],
    },
    ...overrides,
  };
}

function mockPrisma(handlers: {
  findMany?: ReturnType<typeof vi.fn>;
  findFirst?: ReturnType<typeof vi.fn>;
  update?: ReturnType<typeof vi.fn>;
  delete?: ReturnType<typeof vi.fn>;
  count?: ReturnType<typeof vi.fn>;
  roleFindFirst?: ReturnType<typeof vi.fn>;
}) {
  const tx = {
    membership: {
      findMany: handlers.findMany ?? vi.fn(),
      findFirst: handlers.findFirst ?? vi.fn(),
      update: handlers.update ?? vi.fn(),
      delete: handlers.delete ?? vi.fn(),
      count: handlers.count ?? vi.fn(),
    },
    role: {
      findFirst: handlers.roleFindFirst ?? vi.fn(),
    },
  };
  const withTenant = vi.fn(
    async (_ctx: unknown, fn: (client: typeof tx) => Promise<unknown>) =>
      fn(tx)
  );
  return {
    prisma: { withTenant } as unknown as PrismaService,
    tx,
    withTenant,
  };
}

describe('MembersService.list', () => {
  it('returns a page and nextCursor when more rows exist', async () => {
    const rows = [
      memberRow({ id: '01936b3c-0000-7000-8000-000000000001' }),
      memberRow({ id: '01936b3c-0000-7000-8000-000000000002' }),
      memberRow({ id: '01936b3c-0000-7000-8000-000000000003' }),
    ];
    const findMany = vi.fn().mockResolvedValue(rows);
    const { prisma } = mockPrisma({ findMany });
    const service = new MembersService(prisma);

    const page = await service.list(access, { limit: 2 });

    expect(page.items).toHaveLength(2);
    expect(page.nextCursor).toBe('01936b3c-0000-7000-8000-000000000002');
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 3, orderBy: { id: 'asc' } })
    );
  });

  it('rejects a non-uuid cursor', async () => {
    const { prisma } = mockPrisma({});
    const service = new MembersService(prisma);
    await expect(
      service.list(access, { limit: 20, cursor: 'not-a-uuid' })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('escapes ILIKE wildcards in q before querying', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const { prisma } = mockPrisma({ findMany });
    const service = new MembersService(prisma);

    await service.list(access, { limit: 20, q: '%_\\' });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            {
              user: {
                name: { contains: '\\%\\_\\\\', mode: 'insensitive' },
              },
            },
            {
              user: {
                email: { contains: '\\%\\_\\\\', mode: 'insensitive' },
              },
            },
          ],
        }),
      })
    );
  });
});

describe('MembersService.deactivate', () => {
  it('forbids deactivating an Owner', async () => {
    const findFirst = vi.fn().mockResolvedValue(
      memberRow({
        id: ownerMembershipId,
        role: {
          id: 'role-owner',
          name: SYSTEM_ROLE_NAMES.OWNER,
          permissions: [PERMISSIONS.SPACE_DELETE],
        },
      })
    );
    const { prisma } = mockPrisma({ findFirst });
    const service = new MembersService(prisma);

    await expect(
      service.deactivate(access, ownerMembershipId)
    ).rejects.toMatchObject({
      response: { code: ErrorCode.CANNOT_MODIFY_OWNER },
    });
    await expect(
      service.deactivate(access, ownerMembershipId)
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('forbids deactivating yourself', async () => {
    const findFirst = vi.fn().mockResolvedValue(
      memberRow({ userId: actorId, id: access.membershipId })
    );
    const { prisma } = mockPrisma({ findFirst });
    const service = new MembersService(prisma);

    await expect(
      service.deactivate(access, access.membershipId)
    ).rejects.toMatchObject({
      response: { code: ErrorCode.CANNOT_DEACTIVATE_SELF },
    });
  });

  it('sets status to deactivated', async () => {
    const current = memberRow();
    const findFirst = vi.fn().mockResolvedValue(current);
    const update = vi.fn().mockResolvedValue({
      ...current,
      status: 'deactivated',
    });
    const { prisma } = mockPrisma({ findFirst, update });
    const service = new MembersService(prisma);

    const result = await service.deactivate(access, membershipId);

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: membershipId },
        data: { status: 'deactivated' },
      })
    );
    expect(result.membershipStatus).toBe('deactivated');
  });
});

describe('MembersService.remove', () => {
  it('forbids removing yourself (leave instead)', async () => {
    const findFirst = vi.fn().mockResolvedValue(
      memberRow({ userId: actorId, id: access.membershipId })
    );
    const { prisma } = mockPrisma({ findFirst });
    const service = new MembersService(prisma);

    await expect(
      service.remove(access, access.membershipId)
    ).rejects.toMatchObject({
      response: { code: ErrorCode.CANNOT_REMOVE_SELF },
    });
  });

  it('returns 404 when the membership is missing', async () => {
    const findFirst = vi.fn().mockResolvedValue(null);
    const { prisma } = mockPrisma({ findFirst });
    const service = new MembersService(prisma);

    await expect(service.remove(access, membershipId)).rejects.toBeInstanceOf(
      NotFoundException
    );
  });
});

describe('MembersService.updateRole', () => {
  it('forbids changing your own role', async () => {
    const findFirst = vi.fn().mockResolvedValue(
      memberRow({ userId: actorId, id: access.membershipId })
    );
    const { prisma } = mockPrisma({ findFirst });
    const service = new MembersService(prisma);

    await expect(
      service.updateRole(access, access.membershipId, adminRoleId)
    ).rejects.toMatchObject({
      response: { code: ErrorCode.CANNOT_CHANGE_OWN_ROLE },
    });
  });

  it('forbids changing the Owner', async () => {
    const findFirst = vi.fn().mockResolvedValue(
      memberRow({
        id: ownerMembershipId,
        role: {
          id: ownerRoleId,
          name: SYSTEM_ROLE_NAMES.OWNER,
          permissions: [PERMISSIONS.SPACE_DELETE],
        },
      })
    );
    const { prisma } = mockPrisma({ findFirst });
    const service = new MembersService(prisma);

    await expect(
      service.updateRole(access, ownerMembershipId, memberRoleId)
    ).rejects.toMatchObject({
      response: { code: ErrorCode.CANNOT_MODIFY_OWNER },
    });
  });

  it('forbids assigning Owner', async () => {
    const findFirst = vi.fn().mockResolvedValue(memberRow());
    const roleFindFirst = vi.fn().mockResolvedValue({
      id: ownerRoleId,
      name: SYSTEM_ROLE_NAMES.OWNER,
      permissions: [PERMISSIONS.SPACE_DELETE],
    });
    const { prisma } = mockPrisma({ findFirst, roleFindFirst });
    const service = new MembersService(prisma);

    await expect(
      service.updateRole(access, membershipId, ownerRoleId)
    ).rejects.toMatchObject({
      response: { code: ErrorCode.CANNOT_ASSIGN_OWNER },
    });
  });

  it('forbids escalation beyond the actor permissions', async () => {
    const findFirst = vi.fn().mockResolvedValue(memberRow());
    const roleFindFirst = vi.fn().mockResolvedValue({
      id: adminRoleId,
      name: SYSTEM_ROLE_NAMES.ADMIN,
      permissions: [PERMISSIONS.SPACE_DELETE, PERMISSIONS.ROLES_WRITE],
    });
    const { prisma } = mockPrisma({ findFirst, roleFindFirst });
    const service = new MembersService(prisma);

    await expect(
      service.updateRole(access, membershipId, adminRoleId)
    ).rejects.toMatchObject({
      response: { code: ErrorCode.ROLE_ESCALATION },
    });
  });

  it('returns 404 for a role in another workspace', async () => {
    const findFirst = vi.fn().mockResolvedValue(memberRow());
    const roleFindFirst = vi.fn().mockResolvedValue(null);
    const { prisma } = mockPrisma({ findFirst, roleFindFirst });
    const service = new MembersService(prisma);

    await expect(
      service.updateRole(access, membershipId, adminRoleId)
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates the role when the grant is a subset', async () => {
    const findFirst = vi.fn().mockResolvedValue(memberRow());
    const roleFindFirst = vi.fn().mockResolvedValue({
      id: adminRoleId,
      name: SYSTEM_ROLE_NAMES.ADMIN,
      permissions: [PERMISSIONS.MEMBERS_READ, PERMISSIONS.ROLES_WRITE],
    });
    const update = vi.fn().mockResolvedValue(
      memberRow({
        role: {
          id: adminRoleId,
          name: SYSTEM_ROLE_NAMES.ADMIN,
          permissions: [PERMISSIONS.MEMBERS_READ, PERMISSIONS.ROLES_WRITE],
        },
      })
    );
    const { prisma } = mockPrisma({ findFirst, roleFindFirst, update });
    const service = new MembersService(prisma);

    const result = await service.updateRole(access, membershipId, adminRoleId);

    expect(update).toHaveBeenCalledWith({
      where: { id: membershipId },
      data: { roleId: adminRoleId },
      include: expect.any(Object),
    });
    expect(result.role).toEqual({
      id: adminRoleId,
      name: SYSTEM_ROLE_NAMES.ADMIN,
      permissions: [PERMISSIONS.MEMBERS_READ, PERMISSIONS.ROLES_WRITE],
    });
  });

  it('forbids demoting a member whose current role is above the actor', async () => {
    const findFirst = vi.fn().mockResolvedValue(
      memberRow({
        role: {
          id: 'co-owner',
          name: 'Co-owner',
          permissions: [PERMISSIONS.SPACE_DELETE, PERMISSIONS.MEMBERS_READ],
        },
      })
    );
    const { prisma } = mockPrisma({ findFirst });
    const service = new MembersService(prisma);

    await expect(
      service.updateRole(access, membershipId, memberRoleId)
    ).rejects.toMatchObject({
      response: { code: ErrorCode.ROLE_ESCALATION },
    });
  });

  it('forbids deactivating a member whose current role is above the actor', async () => {
    const findFirst = vi.fn().mockResolvedValue(
      memberRow({
        role: {
          id: 'co-owner',
          name: 'Co-owner',
          permissions: [PERMISSIONS.SPACE_DELETE],
        },
      })
    );
    const { prisma } = mockPrisma({ findFirst });
    const service = new MembersService(prisma);

    await expect(
      service.deactivate(access, membershipId)
    ).rejects.toMatchObject({
      response: { code: ErrorCode.ROLE_ESCALATION },
    });
  });
});

describe('MembersService.leave', () => {
  it('blocks the last Owner', async () => {
    const ownerAccess = {
      ...access,
      roleName: SYSTEM_ROLE_NAMES.OWNER,
      membershipId: ownerMembershipId,
    };
    const count = vi.fn().mockResolvedValue(1);
    const { prisma } = mockPrisma({ count });
    const service = new MembersService(prisma);

    await expect(service.leave(ownerAccess)).rejects.toMatchObject({
      response: { code: ErrorCode.LAST_OWNER },
    });
  });

  it('allows a Member to leave', async () => {
    const memberAccess = {
      ...access,
      roleName: SYSTEM_ROLE_NAMES.MEMBER,
      membershipId,
    };
    const deleteFn = vi.fn().mockResolvedValue({});
    const { prisma } = mockPrisma({ delete: deleteFn });
    const service = new MembersService(prisma);

    await service.leave(memberAccess);

    expect(deleteFn).toHaveBeenCalledWith({ where: { id: membershipId } });
  });
});
