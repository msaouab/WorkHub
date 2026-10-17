import type { PrismaService } from '@work-hub/database';
import { describe, expect, it, vi } from 'vitest';
import { UsersService } from './users.service';

describe('UsersService', () => {
  it('updates only the given user locale and returns public fields', async () => {
    const update = vi.fn().mockResolvedValue({
      id: 'u1',
      email: 'ali@test.local',
      name: 'Ali',
      emailVerified: true,
      image: null,
      locale: 'ar',
      internalFlag: true,
    });
    const service = new UsersService({
      user: { update },
    } as unknown as PrismaService);

    await expect(service.updateLocale('u1', 'ar')).resolves.toEqual({
      id: 'u1',
      email: 'ali@test.local',
      name: 'Ali',
      emailVerified: true,
      image: null,
      locale: 'ar',
    });
    expect(update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { locale: 'ar' },
    });
  });
});
