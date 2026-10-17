import type { PrismaService } from '@work-hub/database';
import type { StorageService } from '@work-hub/storage';
import { describe, expect, it, vi } from 'vitest';
import { UsersService } from './users.service';

function mockStorage(): StorageService {
  return {
    put: vi.fn(),
    delete: vi.fn(),
    publicUrl: (key: string) => `http://storage.test/${key}`,
  } as unknown as StorageService;
}

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
    const service = new UsersService(
      { user: { update } } as unknown as PrismaService,
      mockStorage()
    );

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

  it('derives avatar storage prefix only from our URLs for that user', () => {
    const service = new UsersService(
      {} as unknown as PrismaService,
      mockStorage()
    );
    expect(
      service.avatarPrefixFromImageUrl(
        'u1',
        'http://storage.test/users/u1/avatar/abc/256.webp'
      )
    ).toBe('users/u1/avatar/abc');
    expect(
      service.avatarPrefixFromImageUrl('u1', 'https://evil.example/x.png')
    ).toBeNull();
    expect(
      service.avatarPrefixFromImageUrl(
        'u1',
        'http://storage.test/users/other/avatar/abc/256.webp'
      )
    ).toBeNull();
  });
});
