#!/usr/bin/env bash
# One-time (idempotent) setup of an Ubuntu 24.04 server for WorkHub.
# Runs on the server; deploy.sh calls it automatically.
#
#   PUBLIC_URL=http://144.21.62.185 bash deploy/setup-server.sh

set -euo pipefail

PUBLIC_URL=${PUBLIC_URL:?set PUBLIC_URL, e.g. http://144.21.62.185 or https://workhub.example.com}
APP_DIR=/opt/workhub
NODE_MAJOR=22
export DEBIAN_FRONTEND=noninteractive

# --- Node.js (NodeSource apt repo) + nginx ---
if ! node -v 2>/dev/null | grep -q "^v${NODE_MAJOR}\."; then
  sudo install -d -m 755 /etc/apt/keyrings
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key |
    sudo gpg --dearmor --yes -o /etc/apt/keyrings/nodesource.gpg
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_MAJOR}.x nodistro main" |
    sudo tee /etc/apt/sources.list.d/nodesource.list >/dev/null
  sudo apt-get update -qq
fi
sudo apt-get install -y -qq nodejs nginx rsync >/dev/null
sudo corepack enable

# --- App directory ---
sudo install -d -o "$USER" -g "$USER" "$APP_DIR"

# --- Firewall: Oracle's Ubuntu image rejects everything but SSH ---
for port in 80 443; do
  sudo iptables -C INPUT -p tcp -m state --state NEW --dport "$port" -j ACCEPT 2>/dev/null ||
    sudo iptables -I INPUT 5 -p tcp -m state --state NEW --dport "$port" -j ACCEPT
done
sudo netfilter-persistent save >/dev/null

# --- Production config (never overwritten by deploys) ---
# API: real env vars via systemd (the API ignores .env files in production).
sudo install -d -m 755 /etc/workhub
if [[ ! -f /etc/workhub/api.env ]]; then
  sudo install -m 600 /dev/null /etc/workhub/api.env
  sudo tee /etc/workhub/api.env >/dev/null <<EOF
NODE_ENV=production
HOST=127.0.0.1
PORT=3333
APP_URL=$PUBLIC_URL
API_PREFIX=api/v1
SWAGGER_PATH=docs
SWAGGER_ENABLED=false
CORS_ORIGINS=$PUBLIC_URL
EOF
fi
# Web: NEXT_PUBLIC_* values are baked in at build time.
install -d "$APP_DIR/apps/client"
if [[ ! -f $APP_DIR/apps/client/.env.production.local ]]; then
  cat > "$APP_DIR/apps/client/.env.production.local" <<EOF
NEXT_PUBLIC_APP_URL=$PUBLIC_URL
NEXT_PUBLIC_API_URL=$PUBLIC_URL
NEXT_PUBLIC_API_PREFIX=api/v1
EOF
fi

# --- systemd services + nginx site ---
sudo install -m 644 "$APP_DIR/deploy/workhub-api.service" /etc/systemd/system/
sudo install -m 644 "$APP_DIR/deploy/workhub-web.service" /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable workhub-api workhub-web >/dev/null 2>&1

sudo install -m 644 "$APP_DIR/deploy/nginx.conf" /etc/nginx/sites-available/workhub
sudo ln -sf /etc/nginx/sites-available/workhub /etc/nginx/sites-enabled/workhub
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t -q
sudo systemctl reload nginx

echo "setup done"
