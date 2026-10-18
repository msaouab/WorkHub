import { createHash, randomBytes } from 'node:crypto';

/** Opaque invite token (URL-safe). Only a SHA-256 hash is stored. */
export function generateInviteToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashInviteToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}
