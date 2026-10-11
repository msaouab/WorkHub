/** Hosts that can only be this machine's own database (or the docker-compose service). */
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', 'postgres']);

export type SeedEnv = { databaseUrl: string; secret: string };

/**
 * Seeding writes known passwords, so it must never touch a real database.
 * Refuses production and non-local hosts (unless SEED_ALLOW_REMOTE=true).
 */
export function assertSafeToSeed(env: NodeJS.ProcessEnv): SeedEnv {
  if (env['NODE_ENV'] === 'production') {
    throw new Error('Refusing to seed: NODE_ENV=production');
  }
  const databaseUrl = env['DATABASE_MIGRATION_URL'];
  const secret = env['BETTER_AUTH_SECRET'];
  if (!databaseUrl || !secret) {
    throw new Error(
      'DATABASE_MIGRATION_URL and BETTER_AUTH_SECRET must be set (see apps/server/.env.example)'
    );
  }
  const host = new URL(databaseUrl).hostname;
  if (!LOCAL_HOSTS.has(host) && env['SEED_ALLOW_REMOTE'] !== 'true') {
    throw new Error(
      `Refusing to seed non-local database host "${host}" (set SEED_ALLOW_REMOTE=true to override)`
    );
  }
  return { databaseUrl, secret };
}