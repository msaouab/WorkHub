-- Shared Postgres extensions used across the schema (case-insensitive email, crypto helpers).
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
