#!/usr/bin/env bash
# Install freetier-monitor (Always Free limits, phone alerts, egress auto-stop) on the server.
#
#   NTFY_TOPIC=my-secret-topic ./deploy/monitor/install.sh        # uses the "oracle" SSH host
#   DEPLOY_HOST=user@1.2.3.4 NTFY_TOPIC=... ./deploy/monitor/install.sh

set -euo pipefail

HOST=${DEPLOY_HOST:-oracle}
NTFY_TOPIC=${NTFY_TOPIC:-}
DIR=$(cd "$(dirname "$0")" && pwd)

scp -q "$DIR/freetier-monitor" "$DIR/freetier-monitor.conf.example" "$HOST:/tmp/"

ssh "$HOST" NTFY_TOPIC="$NTFY_TOPIC" bash -s <<'EOF'
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
sudo apt-get install -y -qq vnstat >/dev/null
sudo systemctl enable --now vnstat >/dev/null 2>&1

sudo install -m 755 /tmp/freetier-monitor /usr/local/bin/freetier-monitor
if [[ ! -f /etc/freetier-monitor.conf ]]; then
  sudo install -m 644 /tmp/freetier-monitor.conf.example /etc/freetier-monitor.conf
fi
if [[ -n $NTFY_TOPIC ]]; then
  sudo sed -i "s/^NTFY_TOPIC=.*/NTFY_TOPIC=\"$NTFY_TOPIC\"/" /etc/freetier-monitor.conf
fi

# every 10 minutes: record, alert, save report, auto-stop/resume
echo "*/10 * * * * root /usr/local/bin/freetier-monitor report >/dev/null 2>&1" |
  sudo tee /etc/cron.d/freetier-monitor >/dev/null

# one-line summary at SSH login
printf '#!/bin/sh\n/usr/local/bin/freetier-monitor motd\n' | sudo tee /etc/update-motd.d/99-freetier >/dev/null
sudo chmod 755 /etc/update-motd.d/99-freetier

# answer "status" / "top" / "traffic" sent from the ntfy app
sudo tee /etc/systemd/system/freetier-listen.service >/dev/null <<UNIT
[Unit]
Description=freetier-monitor: answer commands sent from the ntfy app
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/freetier-monitor listen
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
UNIT
sudo systemctl daemon-reload
if grep -q '^NTFY_TOPIC=""' /etc/freetier-monitor.conf; then
  echo "NTFY_TOPIC not set: phone alerts and commands disabled"
else
  sudo systemctl enable --now freetier-listen >/dev/null 2>&1
fi

sudo /usr/local/bin/freetier-monitor report
echo "freetier-monitor installed"
EOF
