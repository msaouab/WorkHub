import { describe, expect, it } from 'vitest';
import { MeController } from './me.controller';

describe('MeController', () => {
  it('returns only the public user fields', () => {
    const session = {
      session: { id: 's1', token: 'secret-token' },
      user: {
        id: 'u1', email: 'ali@test.local', name: 'Ali', emailVerified: true,
        image: undefined, locale: 'en', createdAt: new Date(), internalFlag: true,
      },
    };
    expect(new MeController().getMe(session as never)).toEqual({
      id: 'u1', email: 'ali@test.local', name: 'Ali', emailVerified: true, image: null, locale: 'en',
    });
  });
});