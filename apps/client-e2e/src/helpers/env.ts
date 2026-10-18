import { resolve } from 'node:path';

export const baseURL = process.env['BASE_URL'] ?? 'http://localhost:3000';
export const apiURL = process.env['API_URL'] ?? 'http://localhost:3333';
export const mailpitURL = process.env['MAILPIT_URL'] ?? 'http://localhost:8025';
export const seedPassword = process.env['SEED_PASSWORD'] ?? 'workhub-dev-1';

export const seedAccounts = {
  owner: { email: 'owner@workhub.test', role: 'owner' },
  admin: { email: 'admin@workhub.test', role: 'admin' },
  member: { email: 'member@workhub.test', role: 'member' },
} as const;

export type SeedRole = keyof typeof seedAccounts;

/** Absolute path to a saved Playwright storage state for a seed role. */
export function authStatePath(role: SeedRole): string {
  return resolve(import.meta.dirname, '../../playwright/.auth', `${role}.json`);
}
