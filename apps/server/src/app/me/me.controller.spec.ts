import { LOCALES } from '@work-hub/constants';
import { Locale, type PrismaService } from '@work-hub/database';
import { describe, expect, it, vi } from 'vitest';
import { MeController } from './me.controller';

const user = {
  id: 'u1', email: 'ali@test.local', name: 'Ali', emailVerified: true,
  image: null, locale: 'en', createdAt: new Date(), internalFlag: true,
};
const session = { session: { id: 's1', token: 'secret-token' }, user };
const publicUser = {
  id: 'u1', email: 'ali@test.local', name: 'Ali', emailVerified: true, image: null, locale: 'en',
};

describe('MeController', () => {
  it('returns only the public user fields', () => {
    const controller = new MeController({} as PrismaService);
    expect(controller.getMe(session as never)).toEqual(publicUser);
  });

  it("updates only the signed-in user's language", async () => {
    const update = vi.fn().mockResolvedValue({ ...user, locale: 'ar' });
    const controller = new MeController({ user: { update } } as unknown as PrismaService);

    await expect(controller.updateMe(session as never, { locale: 'ar' })).resolves.toEqual({
      ...publicUser,
      locale: 'ar',
    });
    expect(update).toHaveBeenCalledWith({ where: { id: 'u1' }, data: { locale: 'ar' } });
  });

  it('supports exactly the languages the database allows', () => {
    expect([...LOCALES].sort()).toEqual(Object.values(Locale).sort());
  });
});