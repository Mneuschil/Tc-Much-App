# Deployment-Anleitung

## VPS Setup (Ubuntu)

### Voraussetzungen
- Ubuntu 22.04+
- 4 vCPU, 8 GB RAM, 80 GB SSD
- Root-Zugang

### 1. System vorbereiten
```bash
apt update && apt upgrade -y
apt install -y curl git nginx certbot python3-certbot-nginx
```

### 2. Node.js installieren
```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs
```

### 3. PostgreSQL installieren
```bash
apt install -y postgresql postgresql-contrib
sudo -u postgres createuser tennisclub
sudo -u postgres createdb tennisclub -O tennisclub
sudo -u postgres psql -c "ALTER USER tennisclub PASSWORD 'sicheres-passwort';"
```

### 4. PM2 installieren
```bash
npm install -g pm2
```

### 5. App deployen
```bash
git clone <repo-url> /var/www/tennis-club
cd /var/www/tennis-club
npm install
npm run build -w shared
npm run build -w backend
npm run db:migrate -w backend
npm run db:seed -w backend
pm2 start backend/dist/server.js --name tennis-api
pm2 save
pm2 startup
```

### 6. Nginx konfigurieren
```nginx
server {
    server_name api.deine-domain.de;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    location /uploads/ {
        alias /var/www/uploads/;
    }
}
```

### 7. SSL einrichten
```bash
certbot --nginx -d api.deine-domain.de
```

*Detaillierte Anleitung wird bei Bedarf erweitert.*
