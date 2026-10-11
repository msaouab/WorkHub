import 'reflect-metadata'; // @work-hub/database also exports Nest classes, whose decorators need it
import { PrismaPg } from '@prisma/adapter-pg';
import { createAuth } from '@work-hub/auth';
import { PrismaClient } from '@work-hub/database';
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { assertSafeToSeed } from './guard';
import { deleteSeedUsers, seedUsers } from './seed-users';

// Same env files as the server and Prisma CLI.
const serverDir = resolve(import.meta.dirname, '../../../apps/server');
config({ path: [resolve(serverDir, '.env.local'), resolve(serverDir, '.env')], quiet: true });

const DEFAULT_PASSWORD = 'workhub-dev-1';

async function main() {
  const { databaseUrl, secret } = assertSafeToSeed(process.env);
  const password = process.env['SEED_PASSWORD'] ?? DEFAULT_PASSWORD;

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });
  const auth = createAuth({
    prisma,
    // Seed users are verified directly, so no email is ever sent.
    mail: { sendVerifyEmail: async () => true, sendPasswordReset: async () => true },
    config: {
      baseUrl: process.env['APP_URL'] ?? 'http://localhost:3333',
      secret,
      trustedOrigins: [],
    },
  });

  try {
    if (process.argv.includes('--reset')) {
      console.log(`Removed ${await deleteSeedUsers(prisma)} seed users`);
    }
    const results = await seedUsers(auth, prisma, password);
    console.table(results.map((result) => ({ ...result, password })));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});