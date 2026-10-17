-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('active', 'deactivated');

-- CreateTable
CREATE TABLE "spaces" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" CITEXT NOT NULL,
    "default_role_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "spaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "space_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "permissions" TEXT[],
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memberships" (
    "id" UUID NOT NULL,
    "space_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "spaces_slug_key" ON "spaces"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "spaces_default_role_id_key" ON "spaces"("default_role_id");

-- CreateIndex
CREATE INDEX "roles_space_id_idx" ON "roles"("space_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_space_id_name_key" ON "roles"("space_id", "name");

-- CreateIndex
CREATE INDEX "memberships_user_id_idx" ON "memberships"("user_id");

-- CreateIndex
CREATE INDEX "memberships_role_id_idx" ON "memberships"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_space_id_user_id_key" ON "memberships"("space_id", "user_id");

-- AddForeignKey
ALTER TABLE "spaces" ADD CONSTRAINT "spaces_default_role_id_fkey" FOREIGN KEY ("default_role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Row-level security (NFR-01). The API connects as workhub_app (no BYPASSRLS).
-- Tenant context is set per transaction: app.space_id and/or app.user_id.
-- FORCE makes even the table owner subject to policies (owner has BYPASSRLS).
-- ---------------------------------------------------------------------------

ALTER TABLE "spaces" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "spaces" FORCE ROW LEVEL SECURITY;

ALTER TABLE "roles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "roles" FORCE ROW LEVEL SECURITY;

ALTER TABLE "memberships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "memberships" FORCE ROW LEVEL SECURITY;

-- spaces: tenant by id, or spaces the current user belongs to (GET /me/spaces)
CREATE POLICY spaces_select ON "spaces"
  FOR SELECT
  USING (
    id = NULLIF(current_setting('app.space_id', true), '')::uuid
    OR EXISTS (
      SELECT 1
      FROM "memberships" m
      WHERE m.space_id = spaces.id
        AND m.user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
    )
  );

-- Insert requires app.space_id = the new row's id (set in the app before INSERT
-- so Prisma RETURNING passes spaces_select without any create-time escape hatch).
CREATE POLICY spaces_insert ON "spaces"
  FOR INSERT
  WITH CHECK (
    id = NULLIF(current_setting('app.space_id', true), '')::uuid
    AND NULLIF(current_setting('app.user_id', true), '') IS NOT NULL
  );

CREATE POLICY spaces_update ON "spaces"
  FOR UPDATE
  USING (id = NULLIF(current_setting('app.space_id', true), '')::uuid)
  WITH CHECK (id = NULLIF(current_setting('app.space_id', true), '')::uuid);

CREATE POLICY spaces_delete ON "spaces"
  FOR DELETE
  USING (id = NULLIF(current_setting('app.space_id', true), '')::uuid);

-- memberships: tenant rows, or the caller's own rows across spaces
CREATE POLICY memberships_select ON "memberships"
  FOR SELECT
  USING (
    space_id = NULLIF(current_setting('app.space_id', true), '')::uuid
    OR user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
  );

CREATE POLICY memberships_insert ON "memberships"
  FOR INSERT
  WITH CHECK (
    space_id = NULLIF(current_setting('app.space_id', true), '')::uuid
    OR (
      user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
      AND NULLIF(current_setting('app.user_id', true), '') IS NOT NULL
    )
  );

CREATE POLICY memberships_update ON "memberships"
  FOR UPDATE
  USING (space_id = NULLIF(current_setting('app.space_id', true), '')::uuid)
  WITH CHECK (space_id = NULLIF(current_setting('app.space_id', true), '')::uuid);

CREATE POLICY memberships_delete ON "memberships"
  FOR DELETE
  USING (space_id = NULLIF(current_setting('app.space_id', true), '')::uuid);

-- roles: tenant rows, or roles of spaces the user belongs to
CREATE POLICY roles_select ON "roles"
  FOR SELECT
  USING (
    space_id = NULLIF(current_setting('app.space_id', true), '')::uuid
    OR EXISTS (
      SELECT 1
      FROM "memberships" m
      WHERE m.space_id = roles.space_id
        AND m.user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
    )
  );

CREATE POLICY roles_insert ON "roles"
  FOR INSERT
  WITH CHECK (
    space_id = NULLIF(current_setting('app.space_id', true), '')::uuid
  );

CREATE POLICY roles_update ON "roles"
  FOR UPDATE
  USING (space_id = NULLIF(current_setting('app.space_id', true), '')::uuid)
  WITH CHECK (space_id = NULLIF(current_setting('app.space_id', true), '')::uuid);

CREATE POLICY roles_delete ON "roles"
  FOR DELETE
  USING (space_id = NULLIF(current_setting('app.space_id', true), '')::uuid);
