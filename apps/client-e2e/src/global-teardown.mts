/**
 * Deletes users created by auth e2e runs via the seed tool (safe local-only guard).
 */
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

export default async function globalTeardown() {
  const workspaceRoot = resolve(import.meta.dirname, '../../..');
  try {
    execFileSync(
      'pnpm',
      ['exec', 'nx', 'run', '@work-hub/seed:seed', '--', '--e2e-cleanup'],
      {
        cwd: workspaceRoot,
        stdio: 'inherit',
        env: process.env,
      }
    );
  } catch (error) {
    console.warn('[e2e teardown] seed --e2e-cleanup failed', error);
  }
}
