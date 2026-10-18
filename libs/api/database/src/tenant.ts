import type { Prisma } from './generated/prisma/client';

/** Session variables used by Postgres RLS policies (WH-038 / WH-039 / WH-010). */
export type TenantContext = {
  userId?: string;
  spaceId?: string;
  /** SHA-256 hex of an invite token (preview/accept without space membership). */
  inviteTokenHash?: string;
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
  if (ctx.inviteTokenHash !== undefined) {
    await tx.$executeRaw`SELECT set_config('app.invite_token_hash', ${ctx.inviteTokenHash}, true)`;
  }
}
