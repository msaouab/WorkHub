-- WH-058: teams (Groups in UI) + Manager system role for existing workspaces.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE "teams" (
    "id" UUID NOT NULL,
    "space_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "teams_space_id_name_key" ON "teams"("space_id", "name");
CREATE UNIQUE INDEX "teams_id_space_id_key" ON "teams"("id", "space_id");
CREATE INDEX "teams_space_id_idx" ON "teams"("space_id");

ALTER TABLE "teams" ADD CONSTRAINT "teams_space_id_fkey"
  FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Composite FK targets so team_members / team_managers cannot cross workspaces (NFR-01).
CREATE UNIQUE INDEX "memberships_id_space_id_key" ON "memberships"("id", "space_id");

CREATE TABLE "team_members" (
    "id" UUID NOT NULL,
    "space_id" UUID NOT NULL,
    "team_id" UUID NOT NULL,
    "membership_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "team_members_team_id_membership_id_key"
  ON "team_members"("team_id", "membership_id");
CREATE INDEX "team_members_space_id_idx" ON "team_members"("space_id");
CREATE INDEX "team_members_membership_id_idx" ON "team_members"("membership_id");

ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_space_fkey"
  FOREIGN KEY ("team_id", "space_id") REFERENCES "teams"("id", "space_id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_membership_space_fkey"
  FOREIGN KEY ("membership_id", "space_id") REFERENCES "memberships"("id", "space_id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "team_managers" (
    "id" UUID NOT NULL,
    "space_id" UUID NOT NULL,
    "team_id" UUID NOT NULL,
    "membership_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_managers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "team_managers_team_id_membership_id_key"
  ON "team_managers"("team_id", "membership_id");
CREATE INDEX "team_managers_space_id_idx" ON "team_managers"("space_id");
CREATE INDEX "team_managers_membership_id_idx" ON "team_managers"("membership_id");

ALTER TABLE "team_managers" ADD CONSTRAINT "team_managers_team_space_fkey"
  FOREIGN KEY ("team_id", "space_id") REFERENCES "teams"("id", "space_id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "team_managers" ADD CONSTRAINT "team_managers_membership_space_fkey"
  FOREIGN KEY ("membership_id", "space_id") REFERENCES "memberships"("id", "space_id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Row-level security (NFR-01). Tenant by app.space_id.
-- ---------------------------------------------------------------------------

ALTER TABLE "teams" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "teams" FORCE ROW LEVEL SECURITY;

CREATE POLICY teams_select ON "teams"
  FOR SELECT
  USING (space_id = NULLIF(current_setting('app.space_id', true), '')::uuid);

CREATE POLICY teams_insert ON "teams"
  FOR INSERT
  WITH CHECK (space_id = NULLIF(current_setting('app.space_id', true), '')::uuid);

CREATE POLICY teams_update ON "teams"
  FOR UPDATE
  USING (space_id = NULLIF(current_setting('app.space_id', true), '')::uuid)
  WITH CHECK (space_id = NULLIF(current_setting('app.space_id', true), '')::uuid);

CREATE POLICY teams_delete ON "teams"
  FOR DELETE
  USING (space_id = NULLIF(current_setting('app.space_id', true), '')::uuid);

ALTER TABLE "team_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "team_members" FORCE ROW LEVEL SECURITY;

CREATE POLICY team_members_select ON "team_members"
  FOR SELECT
  USING (space_id = NULLIF(current_setting('app.space_id', true), '')::uuid);

CREATE POLICY team_members_insert ON "team_members"
  FOR INSERT
  WITH CHECK (space_id = NULLIF(current_setting('app.space_id', true), '')::uuid);

CREATE POLICY team_members_update ON "team_members"
  FOR UPDATE
  USING (space_id = NULLIF(current_setting('app.space_id', true), '')::uuid)
  WITH CHECK (space_id = NULLIF(current_setting('app.space_id', true), '')::uuid);

CREATE POLICY team_members_delete ON "team_members"
  FOR DELETE
  USING (space_id = NULLIF(current_setting('app.space_id', true), '')::uuid);

ALTER TABLE "team_managers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "team_managers" FORCE ROW LEVEL SECURITY;

CREATE POLICY team_managers_select ON "team_managers"
  FOR SELECT
  USING (space_id = NULLIF(current_setting('app.space_id', true), '')::uuid);

CREATE POLICY team_managers_insert ON "team_managers"
  FOR INSERT
  WITH CHECK (space_id = NULLIF(current_setting('app.space_id', true), '')::uuid);

CREATE POLICY team_managers_update ON "team_managers"
  FOR UPDATE
  USING (space_id = NULLIF(current_setting('app.space_id', true), '')::uuid)
  WITH CHECK (space_id = NULLIF(current_setting('app.space_id', true), '')::uuid);

CREATE POLICY team_managers_delete ON "team_managers"
  FOR DELETE
  USING (space_id = NULLIF(current_setting('app.space_id', true), '')::uuid);

-- ---------------------------------------------------------------------------
-- Backfill Manager system role (Member + leave.approve + documents.fulfil).
-- New workspaces get it from systemRolesFor(); existing ones need this insert.
-- gen_random_uuid() is UUID v4; app-created ids use UUID v7. Acceptable for a
-- one-off backfill (Postgres 16 has no uuidv7()).
-- ---------------------------------------------------------------------------

INSERT INTO "roles" (
  "id",
  "space_id",
  "name",
  "permissions",
  "is_system",
  "created_at",
  "updated_at"
)
SELECT
  gen_random_uuid(),
  s.id,
  'Manager',
  ARRAY[
    'members.read',
    'calendar.read',
    'requests.create',
    'profile.write',
    'leave.approve',
    'documents.fulfil'
  ]::text[],
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "spaces" s
WHERE NOT EXISTS (
  SELECT 1 FROM "roles" r
  WHERE r.space_id = s.id AND r.name = 'Manager'
);
