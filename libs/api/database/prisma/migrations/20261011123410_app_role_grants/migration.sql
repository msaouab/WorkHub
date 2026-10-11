-- Runtime role grants. Kept in a migration (not only the docker init script) because
-- `prisma migrate reset` drops and recreates the public schema, wiping schema grants
-- and default privileges. The role itself must already exist (docker init / ops),
-- so this fails loudly if it is missing.
GRANT USAGE ON SCHEMA public TO workhub_app;

-- Tables and sequences that already exist
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO workhub_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO workhub_app;

-- Tables and sequences created by later migrations (run as the owner role)
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO workhub_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO workhub_app;
