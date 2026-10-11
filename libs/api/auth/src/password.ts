import { hash, verify } from '@node-rs/argon2';

/**
 * argon2id (NFR-06) with the library defaults: 19 MiB memory, 2 passes, 1 lane —
 * OWASP's recommended minimum. Plugged into Better Auth's emailAndPassword.password.
 */
export const passwordHasher = {
  hash: (password: string): Promise<string> => hash(password),
  verify: ({ hash: digest, password }: { hash: string; password: string }): Promise<boolean> =>
    verify(digest, password),
};