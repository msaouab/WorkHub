import { ConflictException } from '@nestjs/common';
import { SYSTEM_ROLE_NAMES } from '@work-hub/constants';
import { Prisma, type PrismaService } from '@work-hub/database';
import type { StorageService } from '@work-hub/storage';
import { describe, expect, it, vi } from 'vitest';
import { SpacesService } from './spaces.service';

function mockStorage(): StorageService {
  return {
    put: vi.fn(),
    delete: vi.fn(),
    publicUrl: (key: string) => `http://storage.test/${key}`,
  } as unknown as StorageService;
}

describe('SpacesService.create', () => {
  it('creates system roles, defaults Member, and makes the creator Owner', async () => {
    const space = {
      id: '01936b3c-0000-7000-8000-000000000001',
      name: 'Acme',
      slug: 'acme',
      logoKey: null,
      coverKey: null,
      coverPreset: 'aurora',
      coverPositionY: 50,
    };

    const spaceCreate = vi.fn().mockResolvedValue(space);
    const spaceUpdate = vi.fn().mockResolvedValue(space);
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
          membership: { create: ReturnType<typeof vi.fn> };
        }) => Promise<unknown>
      ) =>
        fn({
          space: {
            create: spaceCreate,
            update: spaceUpdate,
          },
          membership: { create: membershipCreate },
        })
    );

    const service = new SpacesService(
      { withTenant } as unknown as PrismaService,
      mockStorage()
    );
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
        coverPreset: expect.any(String),
        roles: {
          create: expect.arrayContaining([
            expect.objectContaining({
              name: SYSTEM_ROLE_NAMES.OWNER,
              isSystem: true,
            }),
            expect.objectContaining({
              name: SYSTEM_ROLE_NAMES.ADMIN,
              isSystem: true,
            }),
            expect.objectContaining({
              name: SYSTEM_ROLE_NAMES.MEMBER,
              isSystem: true,
            }),
          ]),
        },
      },
    });
    expect(result.role.name).toBe(SYSTEM_ROLE_NAMES.OWNER);
    expect(result.membershipStatus).toBe('active');
    expect(result.cover?.kind).toBe('preset');
    expect(result.coverPositionY).toBe(50);
    expect(spaceUpdate).toHaveBeenCalledWith({
      where: { id: space.id },
      data: { defaultRoleId: expect.any(String) },
    });
    expect(membershipCreate).toHaveBeenCalledWith({
      data: {
        spaceId: space.id,
        userId: 'user-1',
        roleId: expect.any(String),
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
    const service = new SpacesService(
      { withTenant } as unknown as PrismaService,
      mockStorage()
    );

    await expect(
      service.create('user-1', { name: 'Acme', slug: 'acme' })
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
