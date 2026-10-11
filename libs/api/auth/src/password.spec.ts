import { describe, expect, it } from 'vitest';
import { passwordHasher } from './password';

describe('passwordHasher', () => {
  it('hashes with argon2id and verifies the same password', async () => {
    const digest = await passwordHasher.hash('correct-horse-1');
    expect(digest.startsWith('$argon2id$')).toBe(true);
    await expect(
      passwordHasher.verify({ hash: digest, password: 'correct-horse-1' }),
    ).resolves.toBe(true);
  });

  it('rejects a wrong password', async () => {
    const digest = await passwordHasher.hash('correct-horse-1');
    await expect(
      passwordHasher.verify({ hash: digest, password: 'wrong-horse-1' }),
    ).resolves.toBe(false);
  });

  it('salts every hash (same password → different digests)', async () => {
    const [a, b] = await Promise.all([
      passwordHasher.hash('same-pass-1'),
      passwordHasher.hash('same-pass-1'),
    ]);
    expect(a).not.toBe(b);
  });
});
