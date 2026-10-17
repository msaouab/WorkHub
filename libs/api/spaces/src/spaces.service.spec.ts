import { ConflictException } from '@nestjs/common';
import {
  SYSTEM_ROLE_NAMES,
  SYSTEM_ROLE_PERMISSIONS,
} from '@work-hub/constants';
import { Prisma, type PrismaService } from '@work-hub/database';
import { describe, expect, it, vi } from 'vitest';
import { SpacesService } from './spaces.service';

describe('SpacesService.create', () => {
  it('creates system roles, defaults Member, and makes the creator Owner', async () => {
    const space = {
      id: '01936b3c-0000-7000-8000-000000000001',
      name: 'Acme',
      slug: 'acme',
    };
    const ownerRole = {
      id: 'role-owner',
      name: SYSTEM_ROLE_NAMES.OWNER,
      permissions: [...SYSTEM_ROLE_PERMISSIONS.Owner],
    };
    const memberRole = {
      id: 'role-member',
      name: SYSTEM_ROLE_NAMES.MEMBER,
      permissions: [...SYSTEM_ROLE_PERMISSIONS.Member],
    };

    const spaceCreate = vi.fn().mockResolvedValue(space);
    const roleCreate = vi
      .fn()
      .mockResolvedValueOnce(ownerRole)
      .mockResolvedValueOnce({
        id: 'role-admin',
        name: SYSTEM_ROLE_NAMES.ADMIN,
        permissions: [...SYSTEM_ROLE_PERMISSIONS.Admin],
      })
      .mockResolvedValueOnce(memberRole);
    const spaceUpdate = vi.fn().mockResolvedValue({
      ...space,
      defaultRoleId: memberRole.id,
    });
    const membershipCreate = vi.fn().mockResolvedValue({
      id: 'mem-1',
      status: 'active',
    });

    const withTenant = vi.fn(
      async (
        _ctx: unknown,
        fn: (tx: {
          space: {
            create: ReturnType<typeof vi.fn>;
            update: ReturnType<typeof vi.fn>;
          };
          role: { create: ReturnType<typeof vi.fn> };
          membership: { create: ReturnType<typeof vi.fn> };
        }) => Promise<unknown>
      ) =>
        fn({
          space: {
            create: spaceCreate,
            update: spaceUpdate,
          },
          role: { create: roleCreate },
          membership: { create: membershipCreate },
        })
    );

    const service = new SpacesService({ withTenant } as unknown as PrismaService);
    const result = await service.create('user-1', {
      name: 'Acme',
      slug: 'acme',
    });

    expect(withTenant).toHaveBeenCalledWith(
      { userId: 'user-1', spaceId: expect.any(String) },
      expect.any(Function)
    );
    const tenantCtx = withTenant.mock.calls[0]?.[0] as {
      userId: string;
      spaceId: string;
    };
    expect(spaceCreate).toHaveBeenCalledWith({
      data: {
        id: tenantCtx.spaceId,
        name: 'Acme',
        slug: 'acme',
      },
    });
    expect(result.role.name).toBe(SYSTEM_ROLE_NAMES.OWNER);
    expect(result.membershipStatus).toBe('active');
    expect(spaceUpdate).toHaveBeenCalledWith({
      where: { id: space.id },
      data: { defaultRoleId: 'role-member' },
    });
    expect(membershipCreate).toHaveBeenCalledWith({
      data: {
        spaceId: space.id,
        userId: 'user-1',
        roleId: 'role-owner',
        status: 'active',
      },
    });
  });

  it('maps a duplicate slug to 409 Conflict', async () => {
    const withTenant = vi.fn().mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('unique', {
        code: 'P2002',
        clientVersion: 'test',
      })
    );
    const service = new SpacesService({ withTenant } as unknown as PrismaService);

    await expect(
      service.create('user-1', { name: 'Acme', slug: 'acme' })
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
