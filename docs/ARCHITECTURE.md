# Architektur

## Systemuebersicht

```
Mobile App (Expo)
    ↕ HTTPS / WSS
Nginx (Reverse Proxy + SSL)
    ↕
Express API Server (Node.js)
    ↕                    ↕
PostgreSQL          Socket.io
    ↕
Prisma ORM

n8n (Automation) ← Webhooks ← Express
```

## Multi-Tenant Architektur
- Jeder Verein hat eine eigene `clubId`
- Alle Queries filtern nach `clubId`
- `clubGuard` Middleware stellt sicher, dass User nur eigene Vereinsdaten sehen
- Rollen sind pro Verein vergeben (User.role + User.clubId)

## Auth-Flow
1. User registriert sich mit Club-Code → Server prueft Code, erstellt User
2. Login: E-Mail + Passwort → Server gibt Access + Refresh Token
3. Access Token (15min) → in Zustand (Memory)
4. Refresh Token (30d) → in expo-secure-store
5. Bei 401: Axios Interceptor ruft /auth/refresh auf → neuer Access Token

## Daten-Flow
- Server State: TanStack React Query (fetch, cache, invalidate)
- Client State: Zustand (auth, theme)
- Realtime: Socket.io fuer Posts und Turnier-Ergebnisse

*Wird mit Feature-Implementierung detaillierter.*
