import { ConflictException, NotFoundException } from '@nestjs/common';
import {
  ErrorCode,
  MAX_CUSTOM_ROLES,
  PERMISSIONS,
  SYSTEM_ROLE_NAMES,
} from '@work-hub/constants';
import type { PrismaService } from '@work-hub/database';
import { describe, expect, it, vi } from 'vitest';
import { RolesService } from './roles.service';

const spaceId = '01936b3c-0000-7000-8000-0000000000aa';
const actorId = '01936b3c-0000-7000-8000-0000000000bb';
const adminRoleId = '01936b3c-0000-7000-8000-0000000000a1';
const memberRoleId = '01936b3c-0000-7000-8000-0000000000a2';
const ownerRoleId = '01936b3c-0000-7000-8000-0000000000a3';
const customRoleId = '01936b3c-0000-7000-8000-0000000000a4';

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

function mockPrisma(tx: Record<string, unknown>) {
  const withTenant = vi.fn(
    async (
      _ctx: unknown,
      fn: (client: Record<string, unknown>) => Promise<unknown>
    ) => fn(tx)
  );
  return { prisma: { withTenant } as unknown as PrismaService, withTenant };
}

describe('RolesService.list', () => {
  it('includes Owner and marks the default role', async () => {
    const { prisma } = mockPrisma({
      space: {
        findFirstOrThrow: vi.fn().mockResolvedValue({
          defaultRoleId: memberRoleId,
        }),
      },
      role: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: adminRoleId,
            name: SYSTEM_ROLE_NAMES.ADMIN,
            permissions: [PERMISSIONS.ROLES_WRITE],
            isSystem: true,
            _count: { memberships: 1 },
          },
          {
            id: memberRoleId,
            name: SYSTEM_ROLE_NAMES.MEMBER,
            permissions: [PERMISSIONS.MEMBERS_READ],
            isSystem: true,
            _count: { memberships: 2 },
          },
          {
            id: ownerRoleId,
            name: SYSTEM_ROLE_NAMES.OWNER,
            permissions: [PERMISSIONS.SPACE_DELETE],
            isSystem: true,
            _count: { memberships: 1 },
          },
        ]),
      },
    });
    const service = new RolesService(prisma);

    await expect(service.list(access)).resolves.toEqual({
      items: [
        {
          id: adminRoleId,
          name: SYSTEM_ROLE_NAMES.ADMIN,
          permissions: [PERMISSIONS.ROLES_WRITE],
          isSystem: true,
          isDefault: false,
          memberCount: 1,
        },
        {
          id: memberRoleId,
          name: SYSTEM_ROLE_NAMES.MEMBER,
          permissions: [PERMISSIONS.MEMBERS_READ],
          isSystem: true,
          isDefault: true,
          memberCount: 2,
        },
        {
          id: ownerRoleId,
          name: SYSTEM_ROLE_NAMES.OWNER,
          permissions: [PERMISSIONS.SPACE_DELETE],
          isSystem: true,
          isDefault: false,
          memberCount: 1,
        },
      ],
    });
  });
});

describe('RolesService.create', () => {
  it('rejects permissions the actor does not have', async () => {
    const service = new RolesService(
      mockPrisma({}).prisma
    );

    await expect(
      service.create(access, {
        name: 'Lead',
        permissions: [PERMISSIONS.SPACE_DELETE],
      })
    ).rejects.toMatchObject({
      response: { code: ErrorCode.ROLE_ESCALATION },
    });
  });

  it('rejects reserved system names', async () => {
    const service = new RolesService(mockPrisma({}).prisma);

    await expect(
      service.create(access, {
        name: SYSTEM_ROLE_NAMES.ADMIN,
        permissions: [PERMISSIONS.MEMBERS_READ],
      })
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects a fourth custom permission template', async () => {
    const { prisma } = mockPrisma({
      role: {
        findFirst: vi.fn().mockResolvedValue(null),
        count: vi.fn().mockResolvedValue(MAX_CUSTOM_ROLES),
      },
    });
    const service = new RolesService(prisma);

    await expect(
      service.create(access, {
        name: 'Lead',
        permissions: [PERMISSIONS.MEMBERS_READ],
      })
    ).rejects.toMatchObject({
      response: { code: ErrorCode.ROLE_LIMIT_REACHED },
    });
  });

  it('creates a custom role and can set it as default', async () => {
    const create = vi.fn().mockResolvedValue({
      id: customRoleId,
      name: 'Lead',
      permissions: [PERMISSIONS.MEMBERS_READ],
      isSystem: false,
      _count: { memberships: 0 },
    });
    const spaceUpdate = vi.fn().mockResolvedValue({});
    const { prisma } = mockPrisma({
      role: {
        findFirst: vi.fn().mockResolvedValue(null),
        count: vi.fn().mockResolvedValue(0),
        create,
      },
      space: {
        update: spaceUpdate,
        findFirstOrThrow: vi
          .fn()
          .mockResolvedValue({ defaultRoleId: customRoleId }),
      },
    });
    const service = new RolesService(prisma);

    const result = await service.create(access, {
      name: 'Lead',
      permissions: [PERMISSIONS.MEMBERS_READ],
      isDefault: true,
    });

    expect(create).toHaveBeenCalled();
    expect(spaceUpdate).toHaveBeenCalledWith({
      where: { id: spaceId },
      data: { defaultRoleId: customRoleId },
    });
    expect(result).toEqual({
      id: customRoleId,
      name: 'Lead',
      permissions: [PERMISSIONS.MEMBERS_READ],
      isSystem: false,
      isDefault: true,
      memberCount: 0,
    });
  });
});

describe('RolesService.update', () => {
  it('locks the Owner role', async () => {
    const { prisma } = mockPrisma({
      role: {
        findFirst: vi.fn().mockResolvedValue({
          id: ownerRoleId,
          name: SYSTEM_ROLE_NAMES.OWNER,
          permissions: [PERMISSIONS.SPACE_DELETE],
          isSystem: true,
        }),
      },
    });
    const service = new RolesService(prisma);

    await expect(
      service.update(access, ownerRoleId, {
        permissions: [PERMISSIONS.MEMBERS_READ],
      })
    ).rejects.toMatchObject({
      response: { code: ErrorCode.SYSTEM_ROLE_LOCKED },
    });
  });

  it('forbids renaming system roles', async () => {
    const { prisma } = mockPrisma({
      role: {
        findFirst: vi.fn().mockResolvedValue({
          id: memberRoleId,
          name: SYSTEM_ROLE_NAMES.MEMBER,
          permissions: [PERMISSIONS.MEMBERS_READ],
          isSystem: true,
        }),
      },
    });
    const service = new RolesService(prisma);

    await expect(
      service.update(access, memberRoleId, { name: 'Staff' })
    ).rejects.toMatchObject({
      response: { code: ErrorCode.SYSTEM_ROLE_LOCKED },
    });
  });

  it('allows editing Member permissions within the actor subset', async () => {
    const update = vi.fn().mockResolvedValue({
      id: memberRoleId,
      name: SYSTEM_ROLE_NAMES.MEMBER,
      permissions: [PERMISSIONS.MEMBERS_READ],
      isSystem: true,
      _count: { memberships: 1 },
    });
    const { prisma } = mockPrisma({
      role: {
        findFirst: vi.fn().mockResolvedValue({
          id: memberRoleId,
          name: SYSTEM_ROLE_NAMES.MEMBER,
          permissions: [PERMISSIONS.MEMBERS_READ, PERMISSIONS.INVITES_WRITE],
          isSystem: true,
        }),
        update,
      },
      space: {
        findFirstOrThrow: vi
          .fn()
          .mockResolvedValue({ defaultRoleId: memberRoleId }),
      },
    });
    const service = new RolesService(prisma);

    const result = await service.update(access, memberRoleId, {
      permissions: [PERMISSIONS.MEMBERS_READ],
    });

    expect(update).toHaveBeenCalled();
    expect(result.permissions).toEqual([PERMISSIONS.MEMBERS_READ]);
  });

  it('forbids editing the role the actor holds', async () => {
    const { prisma } = mockPrisma({
      role: {
        findFirst: vi.fn().mockResolvedValue({
          id: adminRoleId,
          name: SYSTEM_ROLE_NAMES.ADMIN,
          permissions: [PERMISSIONS.ROLES_WRITE],
          isSystem: true,
        }),
      },
    });
    const service = new RolesService(prisma);

    await expect(
      service.update(access, adminRoleId, {
        permissions: [PERMISSIONS.MEMBERS_READ],
      })
    ).rejects.toMatchObject({
      response: { code: ErrorCode.CANNOT_CHANGE_OWN_ROLE },
    });
  });

  it('forbids editing a role above the actor', async () => {
    const { prisma } = mockPrisma({
      role: {
        findFirst: vi.fn().mockResolvedValue({
          id: customRoleId,
          name: 'Co-owner',
          permissions: [PERMISSIONS.SPACE_DELETE, PERMISSIONS.ROLES_WRITE],
          isSystem: false,
        }),
      },
    });
    const service = new RolesService(prisma);

    await expect(
      service.update(access, customRoleId, {
        permissions: [PERMISSIONS.MEMBERS_READ],
      })
    ).rejects.toMatchObject({
      response: { code: ErrorCode.ROLE_ESCALATION },
    });
  });

  it('rejects reserved names case-insensitively', async () => {
    const service = new RolesService(mockPrisma({}).prisma);

    await expect(
      service.create(access, {
        name: 'owner',
        permissions: [PERMISSIONS.MEMBERS_READ],
      })
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns 404 for a role in another workspace', async () => {
    const { prisma } = mockPrisma({
      role: { findFirst: vi.fn().mockResolvedValue(null) },
    });
    const service = new RolesService(prisma);

    await expect(
      service.update(access, customRoleId, { name: 'Lead' })
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('RolesService.delete', () => {
  it('locks system roles', async () => {
    const { prisma } = mockPrisma({
      role: {
        findFirst: vi.fn().mockResolvedValue({
          id: memberRoleId,
          name: SYSTEM_ROLE_NAMES.MEMBER,
          permissions: [PERMISSIONS.MEMBERS_READ],
          isSystem: true,
        }),
      },
    });
    const service = new RolesService(prisma);

    await expect(service.delete(access, memberRoleId)).rejects.toMatchObject({
      response: { code: ErrorCode.SYSTEM_ROLE_LOCKED },
    });
  });

  it('returns 409 when the role is in use', async () => {
    const { prisma } = mockPrisma({
      role: {
        findFirst: vi.fn().mockResolvedValue({
          id: customRoleId,
          name: 'Lead',
          permissions: [PERMISSIONS.MEMBERS_READ],
          isSystem: false,
        }),
        delete: vi.fn(),
      },
      space: {
        findFirstOrThrow: vi
          .fn()
          .mockResolvedValue({ defaultRoleId: memberRoleId }),
      },
      membership: { count: vi.fn().mockResolvedValue(2) },
      invite: { count: vi.fn().mockResolvedValue(0) },
    });
    const service = new RolesService(prisma);

    await expect(service.delete(access, customRoleId)).rejects.toMatchObject({
      response: { code: ErrorCode.ROLE_IN_USE },
    });
  });

  it('deletes an unused custom role', async () => {
    const deleteFn = vi.fn().mockResolvedValue({});
    const { prisma } = mockPrisma({
      role: {
        findFirst: vi.fn().mockResolvedValue({
          id: customRoleId,
          name: 'Lead',
          permissions: [PERMISSIONS.MEMBERS_READ],
          isSystem: false,
        }),
        delete: deleteFn,
      },
      space: {
        findFirstOrThrow: vi
          .fn()
          .mockResolvedValue({ defaultRoleId: memberRoleId }),
      },
      membership: { count: vi.fn().mockResolvedValue(0) },
      invite: { count: vi.fn().mockResolvedValue(0) },
    });
    const service = new RolesService(prisma);

    await service.delete(access, customRoleId);

    expect(deleteFn).toHaveBeenCalledWith({ where: { id: customRoleId } });
  });
});
