-- CreateEnum
CREATE TYPE "InviteKind" AS ENUM ('email', 'link');

-- CreateTable
CREATE TABLE "invites" (
    "id" UUID NOT NULL,
    "space_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "kind" "InviteKind" NOT NULL,
    "email" CITEXT,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "max_uses" INTEGER NOT NULL,
    "uses" INTEGER NOT NULL DEFAULT 0,
    "revoked_at" TIMESTAMPTZ(6),
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invites_token_hash_key" ON "invites"("token_hash");

-- CreateIndex
CREATE INDEX "invites_space_id_idx" ON "invites"("space_id");

-- CreateIndex
CREATE INDEX "invites_space_id_email_idx" ON "invites"("space_id", "email");

-- AddForeignKey
ALTER TABLE "invites" ADD CONSTRAINT "invites_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invites" ADD CONSTRAINT "invites_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invites" ADD CONSTRAINT "invites_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Email invites must carry an email; link invites must not.
ALTER TABLE "invites" ADD CONSTRAINT "invites_email_kind_check" CHECK (
  ("kind" = 'email' AND "email" IS NOT NULL)
  OR ("kind" = 'link' AND "email" IS NULL)
);

-- ---------------------------------------------------------------------------
-- Row-level security (NFR-01). Tenant by app.space_id.
-- Token preview/accept (no membership) is intentionally out of scope for
-- this migration; slice 2 will add a privileged path or a token policy.
-- ---------------------------------------------------------------------------

ALTER TABLE "invites" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invites" FORCE ROW LEVEL SECURITY;

CREATE POLICY invites_select ON "invites"
  FOR SELECT
  USING (
    space_id = NULLIF(current_setting('app.space_id', true), '')::uuid
  );

CREATE POLICY invites_insert ON "invites"
  FOR INSERT
  WITH CHECK (
    space_id = NULLIF(current_setting('app.space_id', true), '')::uuid
  );

CREATE POLICY invites_update ON "invites"
  FOR UPDATE
  USING (space_id = NULLIF(current_setting('app.space_id', true), '')::uuid)
  WITH CHECK (space_id = NULLIF(current_setting('app.space_id', true), '')::uuid);

CREATE POLICY invites_delete ON "invites"
  FOR DELETE
  USING (space_id = NULLIF(current_setting('app.space_id', true), '')::uuid);
