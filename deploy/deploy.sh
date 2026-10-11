#!/usr/bin/env bash
# Deploy WorkHub from this machine to the Oracle server:
# sync the code, build on the server, restart the services, check health.
#
#   ./deploy/deploy.sh                      # uses the "oracle" SSH host
#   DEPLOY_HOST=user@1.2.3.4 ./deploy/deploy.sh

set -euo pipefail

HOST=${DEPLOY_HOST:-oracle}
PUBLIC_URL=${PUBLIC_URL:-http://144.21.62.185}
APP_DIR=/opt/workhub

cd "$(git rev-parse --show-toplevel)"

if [[ -n $(git status --porcelain) ]]; then
  echo "note: deploying uncommitted local changes"
fi

echo "==> Preparing server"
ssh "$HOST" "sudo install -d -o \$USER -g \$USER $APP_DIR"
rsync -az "deploy/" "$HOST:$APP_DIR/deploy/"
ssh "$HOST" "PUBLIC_URL=$PUBLIC_URL bash $APP_DIR/deploy/setup-server.sh"

echo "==> Syncing code ($(git rev-parse --short HEAD))"
# Gitignored files (node_modules, builds, .env*) are neither sent nor deleted on the server.
rsync -az --delete \
  --exclude .git \
  --filter='P .env*' \
  --filter=':- .gitignore' \
  ./ "$HOST:$APP_DIR/"

echo "==> Building on server"
ssh "$HOST" bash -s <<EOF
set -euo pipefail
cd $APP_DIR
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0 NX_DAEMON=false NX_NO_CLOUD=true NX_TUI=false NEXT_TELEMETRY_DISABLED=1 CI=true
pnpm install --frozen-lockfile
pnpm exec nx run server:build --skip-nx-cache
pnpm exec nx run @work-hub/client:build --skip-nx-cache
EOF

echo "==> Restarting services"
ssh "$HOST" "sudo systemctl restart workhub-api workhub-web"

echo "==> Health check"
for i in $(seq 1 30); do
  if ssh "$HOST" "curl -fsS -o /dev/null http://127.0.0.1/health/live && curl -fsS -o /dev/null http://127.0.0.1/"; then
    echo "WorkHub is live: $PUBLIC_URL"
    exit 0
  fi
  sleep 2
done
echo "Health check failed. Logs: ssh $HOST 'journalctl -u workhub-api -u workhub-web -n 50'" >&2
exit 1
