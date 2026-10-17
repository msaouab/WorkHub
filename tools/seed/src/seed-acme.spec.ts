import { SYSTEM_ROLE_NAMES } from '@work-hub/constants';
import { describe, expect, it, vi } from 'vitest';
import { ACME_NAME, ACME_SLUG, seedAcmeSpace } from './seed-acme';

describe('seedAcmeSpace', () => {
  it('creates Acme atomically when missing', async () => {
    const spaceCreate = vi.fn().mockResolvedValue({});
    const spaceUpdate = vi.fn().mockResolvedValue({});
    const membershipCreateMany = vi.fn().mockResolvedValue({ count: 3 });
    const tx = {
      space: { create: spaceCreate, update: spaceUpdate },
      membership: { createMany: membershipCreateMany },
    };

    const prisma = {
      user: {
        findUniqueOrThrow: vi
          .fn()
          .mockResolvedValueOnce({ id: 'u-owner' })
          .mockResolvedValueOnce({ id: 'u-admin' })
          .mockResolvedValueOnce({ id: 'u-member' }),
      },
      space: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn(),
        update: vi.fn(),
      },
      membership: { createMany: vi.fn(), upsert: vi.fn() },
      $transaction: vi.fn(async (fn: (client: typeof tx) => Promise<void>) =>
        fn(tx)
      ),
    };

    const result = await seedAcmeSpace(prisma as never);

    expect(result.status).toBe('created');
    expect(result.slug).toBe(ACME_SLUG);
    expect(prisma.$transaction).toHaveBeenCalledOnce();
    expect(spaceCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: ACME_NAME,
          slug: ACME_SLUG,
        }),
      })
    );
    expect(membershipCreateMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ userId: 'u-owner' }),
        expect.objectContaining({ userId: 'u-admin' }),
        expect.objectContaining({ userId: 'u-member' }),
      ]),
    });
  });

  it('is idempotent when Acme already exists and refreshes role permissions', async () => {
    const upsert = vi.fn().mockResolvedValue({});
    const roleUpdate = vi.fn().mockResolvedValue({});
    const roles = [
      { id: 'r-o', name: SYSTEM_ROLE_NAMES.OWNER },
      { id: 'r-a', name: SYSTEM_ROLE_NAMES.ADMIN },
      { id: 'r-m', name: SYSTEM_ROLE_NAMES.MEMBER },
    ];
    const prisma = {
      user: {
        findUniqueOrThrow: vi
          .fn()
          .mockResolvedValueOnce({ id: 'u-owner' })
          .mockResolvedValueOnce({ id: 'u-admin' })
          .mockResolvedValueOnce({ id: 'u-member' }),
      },
      space: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'space-1',
          slug: ACME_SLUG,
          defaultRoleId: 'r-m',
          roles,
        }),
        create: vi.fn(),
        update: vi.fn(),
      },
      role: {
        findMany: vi.fn().mockResolvedValue(roles),
        update: roleUpdate,
        create: vi.fn(),
      },
      membership: { createMany: vi.fn(), upsert },
      $transaction: vi.fn(),
    };

    const result = await seedAcmeSpace(prisma as never);

    expect(result).toEqual({
      slug: ACME_SLUG,
      status: 'exists',
      spaceId: 'space-1',
    });
    expect(prisma.space.create).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(roleUpdate).toHaveBeenCalledTimes(3);
    expect(upsert).toHaveBeenCalledTimes(3);
  });
});
