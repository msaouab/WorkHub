import type { Prisma } from './generated/prisma/client';

/** Session variables used by Postgres RLS policies (WH-038 / WH-039). */
export type TenantContext = {
  userId?: string;
  spaceId?: string;
};

export type TenantClient = Prisma.TransactionClient;

/** Apply tenant GUC settings for the current transaction (is_local = true). */
export async function setTenantContext(
  tx: TenantClient,
  ctx: TenantContext
): Promise<void> {
  if (ctx.userId !== undefined) {
    await tx.$executeRaw`SELECT set_config('app.user_id', ${ctx.userId}, true)`;
  }
  if (ctx.spaceId !== undefined) {
    await tx.$executeRaw`SELECT set_config('app.space_id', ${ctx.spaceId}, true)`;
  }
}
