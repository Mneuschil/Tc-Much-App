# Tennis Vereins-App – Claude Code Wissensdatei

## MANDATORY VERIFICATION PROTOCOL

### After EVERY feature implementation:
1. Run `cd backend && npx tsc --noEmit` → must be 0 errors
2. Run `cd backend && npm test` → all tests must pass
3. Run `cd app && npx tsc --noEmit` → must be 0 errors
4. Test the API endpoint manually with curl and show the response
5. No `any` types in TypeScript
6. No `console.log` in production code (use logger)
7. No `// TODO` or `// FIXME` in implemented code (stubs are okay)

### Before saying "done":
- Run ALL checks above
- Show me the output of each check
- If anything fails → FIX IT FIRST, then report
- NEVER modify a test to make it pass → fix the code instead

### If .auto/acceptance-criteria.json exists:
- Read it at the start of the task
- Update each criterion's status as you complete it
- Do not stop until all criteria are "passed"

### Error handling:
- If an error is unclear → show it and ask, don't guess
- If a dependency is missing → install it, don't skip
- If a test framework isn't set up → set it up first

---

## Projekt-Uebersicht
All-in-One Tennis-Vereins-App: Kommunikation, Turnierverwaltung, Mannschaftsbetrieb, persoenlicher Kalender.
Self-hosted auf eigenem VPS (4 vCPU, 8 GB RAM, Ubuntu). Keine externen Abhaengigkeiten.

## Tech Stack
- **Backend:** Node.js + Express.js + TypeScript + Prisma 6 ORM + PostgreSQL 16 + Socket.io
- **Frontend:** React Native + Expo SDK 55 + Expo Router v4 + TypeScript
- **State:** Zustand (Client) + TanStack React Query (Server)
- **Auth:** JWT Dual-Token (Access 15min + Refresh 30d)
- **Realtime:** Socket.io (News-Feed, Turnier-Ergebnisse)
- **Push:** expo-server-sdk (Expo Push Notifications)
- **Automation:** n8n (auf VPS, Webhooks fuer Mails/Erinnerungen)
- **Validation:** Zod (shared zwischen Frontend + Backend)
- **Process Manager:** PM2
- **Reverse Proxy:** Nginx mit SSL (Let's Encrypt)

## Monorepo-Struktur
- `backend/` – Express API Server
- `app/` – React Native / Expo App
- `shared/` – Shared Types & Zod Schemas (Package: @tennis-club/shared)
- `docs/` – Projektdokumentation

npm workspaces verbinden die Packages. Nach Aenderungen in `shared/`: `npm run build -w shared`

## Architektur-Regeln
1. **Multi-Tenant:** Jede DB-Query MUSS nach clubId filtern. Middleware prueft Club-Zugehoerigkeit.
2. **Rollen:** ADMIN > SPORTWART > MANNSCHAFTSFUEHRER > MITGLIED. Middleware: requireRole([...])
3. **API-Konvention:** REST, versioniert unter /api/v1/. Responses immer als ApiResponse<T> wrappen.
4. **Fehlerbehandlung:** Niemals Errors schlucken. Immer throw → globaler errorHandler faengt.
5. **TypeScript Strict Mode:** Kein `any`. Alle Funktionen typisiert. Shared Types aus `@tennis-club/shared` importieren.
6. **Prisma:** Niemals raw SQL ausser fuer komplexe aggregierte Queries. Immer Prisma Client.
7. **Socket.io:** Nur fuer Posts und Turnier-Ergebnisse. React Query Refetch reicht fuer selten aktualisierte Daten.
8. **Bilder:** Client komprimiert auf max 1200px (expo-image-manipulator). Server speichert unter /var/www/uploads/{clubId}/. Nginx served statisch.
9. **Tokens:** Access Token in Memory (Zustand), Refresh Token in expo-secure-store. NIEMALS in AsyncStorage.

## Coding-Konventionen
- Dateinamen: camelCase fuer Dateien, PascalCase fuer Komponenten
- Express Routes: router.get/post/put/delete mit async Handler
- Jeder Route-Handler ist maximal 10 Zeilen – Logik gehoert in Services
- React Komponenten: Functional Components mit TypeScript Props Interface
- Hooks: Custom Hooks beginnen mit `use`, sind in `src/hooks/`
- Keine `console.log` im Production Code – nutze den Logger

## Datenbank
- PostgreSQL 16 auf localhost:5432
- Prisma Migrations: `npm run db:migrate -w backend`
- Schema in `backend/prisma/schema.prisma`
- Seed-Script: `npm run db:seed -w backend`

## MVP-Module (Reihenfolge)
1. Kommunikation (Channels + News-Feed + Push)
2. Turnierverwaltung (Clubmeisterschaft + Rangliste)
3. Mannschaftsbetrieb (Verfuegbarkeit + Auto-Aufstellung)
4. Persoenlicher Kalender (Aggregierte View)

## Nicht im MVP
- Platzbuchung (Phase 2)
- Direktnachrichten / Chat (Phase 2)
- Trainerbuchung (Phase 2)
- ClubDesk-Integration (Workaround: n8n-Webhook → Mail)

## Session Resume
- Lies PROJECT_STATUS.md am Anfang jeder Session
- Aktualisiere PROJECT_STATUS.md nach jedem abgeschlossenen Feature

## Session Hygiene
- Nach jedem Feature: /clear oder neue Session empfohlen
- Nie mehr als 2 Features in einer Session implementieren
- Vor /clear: git add -A && git commit

## Bugfix-Template
Wenn ein Bug gemeldet wird, nutze diese Struktur zur Analyse:
1. Was wurde gemacht (welcher Screen/Flow)
2. Erwartetes Verhalten
3. Tatsächliches Verhalten
4. Fehlermeldung (exakt)
5. Root Cause analysieren, dann fixen
6. Nach Fix: tsc --noEmit ausführen

## Security (vor Deployment)
Vor dem ersten Deployment alle Punkte prüfen:
- JWT Secrets ≥ 32 Zeichen
- Alle Routen hinter requireAuth (außer /auth/* und /clubs/verify-code)
- Alle DB-Queries filtern nach clubId
- Input Validation via Zod auf allen POST/PUT Routen
- Helmet + CORS konfiguriert
- File Upload: Typ-Whitelist + Max Size enforced
- Socket.io: JWT Auth im Handshake
- Keine Secrets in Git (.env in .gitignore)
