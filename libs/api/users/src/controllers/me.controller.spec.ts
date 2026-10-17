import { LOCALES } from '@work-hub/constants';
import { Locale } from '@work-hub/database';
import { describe, expect, it, vi } from 'vitest';
import type { UsersService } from '../users.service';
import { MeController } from './me.controller';

const user = {
  id: 'u1',
  email: 'ali@test.local',
  name: 'Ali',
  emailVerified: true,
  image: null,
  locale: 'en',
  createdAt: new Date(),
  internalFlag: true,
};
const session = { session: { id: 's1', token: 'secret-token' }, user };
const publicUser = {
  id: 'u1',
  email: 'ali@test.local',
  name: 'Ali',
  emailVerified: true,
  image: null,
  locale: 'en',
};

describe('MeController', () => {
  it('returns only the public user fields', () => {
    const controller = new MeController({} as UsersService);
    expect(controller.getMe(session as never)).toEqual(publicUser);
  });

  it("updates only the signed-in user's language", async () => {
    const updateLocale = vi.fn().mockResolvedValue({ ...publicUser, locale: 'ar' });
    const controller = new MeController({
      updateLocale,
    } as unknown as UsersService);

    await expect(
      controller.updateMe(session as never, { locale: 'ar' })
    ).resolves.toEqual({
      ...publicUser,
      locale: 'ar',
    });
    expect(updateLocale).toHaveBeenCalledWith('u1', 'ar');
  });

  it('supports exactly the languages the database allows', () => {
    expect([...LOCALES].sort()).toEqual(Object.values(Locale).sort());
  });
});
