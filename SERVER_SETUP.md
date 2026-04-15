# Server-Setup: App-Backend auf Hetzner

> Einmaliges Setup fuer `app-api.tcmuch.de` auf Server `91.99.164.240`.
> Danach laeuft Deployment ueber `scripts/deploy-app-backend.sh`.

---

## 0) Vorab — durch dich (Marius)

### DNS-Eintrag bei deinem Domain-Provider
- Subdomain: `app-api.tcmuch.de`
- Typ: `A`
- Wert: `91.99.164.240`
- TTL: 300

Pruefen nach 5 Min:
```bash
dig app-api.tcmuch.de +short
# muss 91.99.164.240 zeigen
```

### JWT-Secrets generieren (lokal auf Mac)
```bash
echo "JWT_ACCESS_SECRET=$(openssl rand -hex 32)"
echo "JWT_REFRESH_SECRET=$(openssl rand -hex 32)"
echo "WEBHOOK_SECRET=$(openssl rand -hex 32)"
echo "POSTGRES_PASSWORD=$(openssl rand -hex 24)"
```
→ Werte fuer .env unten merken.

---

## 1) SSH zum Server
```bash
ssh root@91.99.164.240
```

---

## 2) Postgres installieren + DB anlegen
```bash
apt update
apt install -y postgresql postgresql-contrib

systemctl enable --now postgresql

# DB + User anlegen (POSTGRES_PASSWORD von oben einsetzen)
sudo -u postgres psql <<'SQL'
CREATE USER tcmuch_app WITH PASSWORD 'POSTGRES_PASSWORD_HIER_EINSETZEN';
CREATE DATABASE tcmuch_app OWNER tcmuch_app;
GRANT ALL PRIVILEGES ON DATABASE tcmuch_app TO tcmuch_app;
SQL
```

Test:
```bash
psql -U tcmuch_app -d tcmuch_app -h localhost -c "SELECT version();"
```

---

## 3) Node + PM2 (falls noch nicht installiert)
```bash
node --version  # sollte v20+ sein, sonst:
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

npm install -g pm2
pm2 startup systemd  # einmalig — folgt der Anweisung die ausgegeben wird
```

---

## 4) Repo klonen
```bash
mkdir -p /opt/tc-much-app
cd /opt/tc-much-app

# Falls Repo public: HTTPS-Klone funktioniert
git clone https://github.com/Mneuschil/Tc-Much-App.git repo

# Falls private: SSH-Deploy-Key generieren + bei GitHub eintragen
# ssh-keygen -t ed25519 -f ~/.ssh/github_tcmuch -N ""
# cat ~/.ssh/github_tcmuch.pub  # → bei GitHub Repo Settings > Deploy Keys hinzufuegen
# git clone git@github.com:Mneuschil/Tc-Much-App.git repo
```

---

## 5) .env aufsetzen
```bash
cp /opt/tc-much-app/repo/tennis-club/backend/.env.production.example /opt/tc-much-app/.env
nano /opt/tc-much-app/.env
```
→ Alle `CHANGE_ME` mit den generierten Secrets ersetzen.
→ `DATABASE_URL=postgresql://tcmuch_app:POSTGRES_PASSWORD@localhost:5432/tcmuch_app`

```bash
chmod 600 /opt/tc-much-app/.env
mkdir -p /opt/tc-much-app/uploads
```

---

## 6) Build + Migrate
```bash
cd /opt/tc-much-app/repo/tennis-club
npm ci --workspaces --include-workspace-root
npm run build -w shared
npm run build -w backend

cd backend
DATABASE_URL=$(grep ^DATABASE_URL /opt/tc-much-app/.env | cut -d= -f2-) \
  npx prisma migrate deploy
DATABASE_URL=$(grep ^DATABASE_URL /opt/tc-much-app/.env | cut -d= -f2-) \
  npx prisma generate
```

---

## 7) PM2 starten
```bash
cd /opt/tc-much-app/repo/tennis-club/backend
pm2 start dist/server.js \
  --name tc-much-app-api \
  --cwd /opt/tc-much-app/repo/tennis-club/backend \
  --update-env \
  -- --env-file=/opt/tc-much-app/.env

pm2 save

# Logs anschauen
pm2 logs tc-much-app-api --lines 20
```

→ Sollte zeigen: `Server laeuft auf Port 3001`

Localer Test:
```bash
curl -s http://localhost:3001/api/v1/health
```

---

## 8) Nginx-Block fuer app-api.tcmuch.de
```bash
cat > /etc/nginx/sites-available/app-api.tcmuch.de <<'NGINX'
server {
    listen 80;
    server_name app-api.tcmuch.de;

    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/app-api.tcmuch.de /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

## 9) SSL via Let's Encrypt
```bash
certbot --nginx -d app-api.tcmuch.de --non-interactive --agree-tos -m deine-mail@beispiel.de --redirect
```
→ certbot erweitert die Nginx-Config automatisch und richtet auto-renew ein.

Test:
```bash
curl -v https://app-api.tcmuch.de/api/v1/health
```

---

## 10) Backup-Cron (taeglich Postgres-Dump)
```bash
mkdir -p /opt/tc-much-app/backups
cat > /etc/cron.daily/tcmuch-app-backup <<'CRON'
#!/bin/bash
TS=$(date +%Y-%m-%d)
PGPASSWORD=$(grep ^DATABASE_URL /opt/tc-much-app/.env | sed -E 's|.*://[^:]+:([^@]+)@.*|\1|') \
  pg_dump -U tcmuch_app -h localhost tcmuch_app | gzip > /opt/tc-much-app/backups/tcmuch_app_$TS.sql.gz
# nur 14 Tage behalten
find /opt/tc-much-app/backups -name "*.sql.gz" -mtime +14 -delete
CRON
chmod +x /etc/cron.daily/tcmuch-app-backup
```

---

## 11) Smoke-Test von deinem Mac
```bash
curl -v https://app-api.tcmuch.de/api/v1/health
# erwarte: 200 OK, JSON {"status":"ok"}
```

Plus DNS:
```bash
dig app-api.tcmuch.de +short  # 91.99.164.240
```

---

## Future Deployments
Nach jeder Code-Aenderung lokal:
```bash
git add -A && git commit -m "..." && git push
cd "/Users/marius/Tc Much App/tennis-club" && bash scripts/deploy-app-backend.sh
```

---

## Troubleshooting
- **PM2 crasht**: `pm2 logs tc-much-app-api --err --lines 50`
- **502 von Nginx**: Backend nicht auf 3001 → `pm2 list` + `lsof -i:3001`
- **DB-Fehler**: `psql -U tcmuch_app -d tcmuch_app -h localhost`
- **certbot failed**: DNS noch nicht propagiert → 5–10 Min warten, retry
