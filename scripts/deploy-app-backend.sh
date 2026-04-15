#!/bin/bash
# Deploy App-Backend auf Hetzner-Server (91.99.164.240)
#
# Voraussetzungen:
#   - SSH-Zugang als root@91.99.164.240
#   - Server-Setup einmalig durchgefuehrt (siehe SERVER_SETUP.md)
#   - DNS app-api.tcmuch.de zeigt auf 91.99.164.240
#   - /opt/tc-much-app/.env existiert auf Server (aus .env.production.example)
#
# Workflow:
#   1. Lokal: alle Aenderungen committen + pushen
#   2. Auf Server: pull, build, prisma migrate, pm2 restart

set -e

SERVER="root@91.99.164.240"
APP_DIR="/opt/tc-much-app/repo"
PM2_NAME="tc-much-app-api"

echo "[deploy] Pruefe lokalen Git-Status..."
if [ -n "$(git status --porcelain)" ]; then
  echo "FEHLER: Es gibt uncommitted Aenderungen. Bitte erst committen + pushen."
  git status --short
  exit 1
fi

echo "[deploy] Pushe nach origin/main..."
git push origin main

echo "[deploy] Verbinde mit Server..."
ssh "$SERVER" bash <<EOF
  set -e
  cd "$APP_DIR"
  echo "[server] git pull..."
  git pull origin main

  echo "[server] npm ci..."
  npm ci --workspaces --include-workspace-root

  echo "[server] build shared..."
  npm run build -w shared

  echo "[server] build backend..."
  npm run build -w backend

  echo "[server] prisma migrate deploy..."
  cd backend
  DATABASE_URL=\$(grep ^DATABASE_URL /opt/tc-much-app/.env | cut -d= -f2-) \\
    npx prisma migrate deploy
  DATABASE_URL=\$(grep ^DATABASE_URL /opt/tc-much-app/.env | cut -d= -f2-) \\
    npx prisma generate

  echo "[server] pm2 restart..."
  pm2 restart $PM2_NAME --update-env || pm2 start /opt/tc-much-app/ecosystem.config.cjs
  pm2 save
EOF

echo ""
echo "[deploy] Health-Check..."
sleep 2
if curl -sf https://app-api.tcmuch.de/api/v1/health >/dev/null; then
  echo "[deploy] OK — Backend antwortet auf https://app-api.tcmuch.de/api/v1/health"
else
  echo "[deploy] FAILED — Health-Check antwortet nicht"
  exit 1
fi
