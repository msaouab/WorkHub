#!/usr/bin/env bash
# Write apps/server/.env (and optionally apps/client/.env) for CI from the
# current environment. Values come from the workflow `env:` block.
set -euo pipefail

root="$(cd "$(dirname "$0")/../.." && pwd)"
with_client=false
if [[ "${1:-}" == "--with-client" ]]; then
  with_client=true
fi

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${DATABASE_MIGRATION_URL:?DATABASE_MIGRATION_URL is required}"
: "${BETTER_AUTH_SECRET:?BETTER_AUTH_SECRET is required}"

cat >"$root/apps/server/.env" <<EOF
NODE_ENV=${NODE_ENV:-test}
HOST=${HOST:-0.0.0.0}
PORT=${PORT:-3333}
APP_URL=${APP_URL:-http://localhost:3333}
API_PREFIX=${API_PREFIX:-api/v1}
SWAGGER_PATH=${SWAGGER_PATH:-docs}
SWAGGER_ENABLED=${SWAGGER_ENABLED:-false}
CORS_ORIGINS=${CORS_ORIGINS:-http://localhost:3000}
DATABASE_URL=${DATABASE_URL}
DATABASE_MIGRATION_URL=${DATABASE_MIGRATION_URL}
BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
SMTP_HOST=${SMTP_HOST:-localhost}
SMTP_PORT=${SMTP_PORT:-1025}
SMTP_SECURE=${SMTP_SECURE:-false}
MAIL_FROM="${MAIL_FROM:-WorkHub <no-reply@workhub.local>}"
STORAGE_ENDPOINT=${STORAGE_ENDPOINT:-http://localhost:9000}
STORAGE_REGION=${STORAGE_REGION:-us-east-1}
STORAGE_BUCKET=${STORAGE_BUCKET:-workhub}
STORAGE_ACCESS_KEY=${STORAGE_ACCESS_KEY:-workhub}
STORAGE_SECRET_KEY=${STORAGE_SECRET_KEY:-workhubsecret}
STORAGE_PUBLIC_BASE_URL=${STORAGE_PUBLIC_BASE_URL:-http://localhost:9000/workhub}
STORAGE_FORCE_PATH_STYLE=${STORAGE_FORCE_PATH_STYLE:-true}
SEED_PASSWORD=${SEED_PASSWORD:-workhub-dev-1}
EOF

if [[ "$with_client" == true ]]; then
  cat >"$root/apps/client/.env" <<EOF
PORT=${CLIENT_PORT:-3000}
NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL:-http://localhost:3000}
NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-http://localhost:3333}
NEXT_PUBLIC_API_PREFIX=${NEXT_PUBLIC_API_PREFIX:-api/v1}
EOF
fi
