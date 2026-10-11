import { LOCALES } from '@work-hub/constants';
import { describe, expect, it } from 'vitest';
import { SEED_EMAIL_DOMAIN, SEED_USERS } from './seed-users';

describe('SEED_USERS', () => {
  it('only uses the reserved .test domain', () => {
    expect(SEED_USERS.every((user) => user.email.endsWith(SEED_EMAIL_DOMAIN))).toBe(true);
  });

  it('has unique emails', () => {
    expect(new Set(SEED_USERS.map((user) => user.email)).size).toBe(SEED_USERS.length);
  });

  it('covers every supported language', () => {
    expect(new Set(SEED_USERS.map((user) => user.locale))).toEqual(new Set(LOCALES));
  });
});