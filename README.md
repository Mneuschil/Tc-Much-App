# Tennis Club App

All-in-One Tennis-Vereins-App: Kommunikation, Turnierverwaltung, Mannschaftsbetrieb, persoenlicher Kalender.

## Tech Stack

- **Backend:** Node.js + Express + TypeScript + Prisma 6 + PostgreSQL 16 + Socket.io
- **Frontend:** React Native + Expo SDK 55 + Expo Router v4 + TypeScript
- **State:** Zustand (Client) + TanStack React Query (Server)
- **Validation:** Zod (shared zwischen Frontend + Backend)
- **Auth:** JWT Dual-Token (Access 15min + Refresh 30d)

## Monorepo-Struktur

```
tennis-club/
  shared/   → Shared Types & Zod Schemas (@tennis-club/shared)
  backend/  → Express API Server
  app/      → React Native / Expo App
  docs/     → Projektdokumentation
```

## Voraussetzungen

- Node.js >= 20
- PostgreSQL 16
- Expo CLI (`npm install -g expo-cli`)

## Setup

```bash
# 1. Dependencies installieren
npm install

# 2. Environment konfigurieren
cp backend/.env.example backend/.env
# → .env anpassen (DB-URL, JWT Secrets >= 32 Zeichen)

# 3. Datenbank aufsetzen
npm run db:push -w backend
npm run db:seed -w backend

# 4. Shared Package bauen (muss vor Backend/App passieren)
npm run build:shared
```

## Development

```bash
# Alles gleichzeitig starten (shared watch + backend + app)
npm run dev

# Oder einzeln:
npm run dev:backend    # Backend mit Hot Reload
npm run dev:app        # Expo Dev Server
```

## Verification

```bash
# Vollstaendige Pruefung (shared build + typecheck + lint + test)
npm run validate

# Einzelne Checks:
npm run typecheck      # TypeScript alle Packages
npm run lint           # ESLint alle Packages
npm run test           # Jest Backend Tests
npm run format:check   # Prettier Check
```

## Datenbank

```bash
npm run db:migrate     # Prisma Migration erstellen
npm run db:push        # Schema ohne Migration pushen (Dev)
npm run db:seed        # Seed-Daten laden
npm run db:studio      # Prisma Studio (DB GUI)
```

## Architektur-Regeln

- **Multi-Tenant:** Jede DB-Query filtert nach `clubId`
- **Rollen:** ADMIN > SPORTWART > MANNSCHAFTSFUEHRER > MITGLIED
- **Route Handler:** Max 10 Zeilen, Logik in Services
- **TypeScript:** Strict Mode, kein `any`, kein `console.log`
- **Validation:** Zod Schemas auf allen POST/PUT/PATCH Routes
- **ESLint:** `--max-warnings 0` in allen Packages
