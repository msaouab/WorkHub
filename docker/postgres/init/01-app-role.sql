-- Least-privilege role used by the running API (DATABASE_URL).
-- Owner role `workhub` (POSTGRES_USER) is for Prisma migrate/studio only
-- (DATABASE_MIGRATION_URL). Init scripts run once on an empty data volume.

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'workhub_app') THEN
    CREATE ROLE workhub_app LOGIN PASSWORD 'workhub_app';
  END IF;
END
$$;

GRANT CONNECT ON DATABASE workhub TO workhub_app;
GRANT USAGE ON SCHEMA public TO workhub_app;

-- Tables/sequences created later by owner `workhub` (migrations)
ALTER DEFAULT PRIVILEGES FOR ROLE workhub IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO workhub_app;

ALTER DEFAULT PRIVILEGES FOR ROLE workhub IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO workhub_app;

-- Any objects already present at init time
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO workhub_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO workhub_app;
