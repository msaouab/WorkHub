import { describe, expect, it } from 'vitest';
import { assertSafeToSeed } from './guard';

const local = {
  DATABASE_MIGRATION_URL: 'postgresql://workhub:workhub@localhost:5434/workhub',
  BETTER_AUTH_SECRET: 'x'.repeat(32),
};

describe('assertSafeToSeed', () => {
  it('allows a local database', () => {
    expect(assertSafeToSeed(local).databaseUrl).toBe(local.DATABASE_MIGRATION_URL);
  });

  it('refuses production', () => {
    expect(() => assertSafeToSeed({ ...local, NODE_ENV: 'production' })).toThrow(/production/);
  });

  it('refuses a remote host unless explicitly allowed', () => {
    const remote = { ...local, DATABASE_MIGRATION_URL: 'postgresql://u:p@db.example.com:5432/workhub' };
    expect(() => assertSafeToSeed(remote)).toThrow(/db\.example\.com/);
    expect(() => assertSafeToSeed({ ...remote, SEED_ALLOW_REMOTE: 'true' })).not.toThrow();
  });

  it('requires the database URL and auth secret', () => {
    expect(() => assertSafeToSeed({})).toThrow(/DATABASE_MIGRATION_URL/);
  });
});