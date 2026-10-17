import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client';
import {
  setTenantContext,
  type TenantClient,
  type TenantContext,
} from './tenant';

/**
 * Nest-managed Prisma client. Uses the runtime app role via `databaseUrl`
 * (never the migration owner URL).
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(config: ConfigService) {
    const connectionString = config.getOrThrow<string>('databaseUrl');
    const adapter = new PrismaPg({ connectionString });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Run `fn` inside a transaction with RLS tenant settings applied.
   * For space create, pass the pre-generated `spaceId` in `ctx` so INSERT
   * and RETURNING both satisfy the normal tenant policies.
   */
  withTenant<T>(
    ctx: TenantContext,
    fn: (tx: TenantClient) => Promise<T>
  ): Promise<T> {
    return this.$transaction(async (tx) => {
      await setTenantContext(tx, ctx);
      return fn(tx);
    });
  }
}
