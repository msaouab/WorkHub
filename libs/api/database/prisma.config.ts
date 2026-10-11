import { config } from 'dotenv';
import { resolve } from 'node:path';
import { defineConfig } from 'prisma/config';

// Prisma 7 no longer auto-loads .env. One source of truth: apps/server/.env(.local).
const serverDir = resolve(import.meta.dirname, '../../../apps/server');
config({ path: [resolve(serverDir, '.env.local'), resolve(serverDir, '.env')], quiet: true });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: {
    // CLI only (migrate/studio) → the OWNER role. The running API never uses this.
    // Not env(): that throws when unset, which breaks `prisma generate` (postinstall) on a
    // fresh clone or in CI. Generate never connects; migrate still fails clearly without a URL.
    url: process.env.DATABASE_MIGRATION_URL ?? '',
  },
});
