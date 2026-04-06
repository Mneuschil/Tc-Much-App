# Backend – Claude Code Hinweise

## Server starten
```bash
npm run dev     # Development mit Hot Reload (tsx watch)
npm run build   # TypeScript kompilieren
npm start       # Production (nach Build)
```

## Neues Feature hinzufuegen
1. Prisma Schema erweitern → `npm run db:migrate`
2. Zod Schema in `shared/` erstellen → `npm run build -w shared`
3. Route-Datei in `routes/` erstellen
4. Service-Datei in `services/` erstellen
5. Route in `routes/index.ts` registrieren
6. Testen via REST Client / curl

## Middleware-Chain (Reihenfolge)
```
Request → CORS → Helmet → Morgan → JSON Parser → Rate Limiter (nur Auth)
  → requireAuth → clubGuard → requireRole → validate(schema) → Route Handler
  → Error Handler → Response
```

## API Response Format
```typescript
// Erfolg
{ success: true, data: { ... } }

// Fehler
{ success: false, error: { code: "VALIDATION_ERROR", message: "..." } }

// Paginiert
{ success: true, data: [...], pagination: { page: 1, limit: 20, total: 100, totalPages: 5 } }
```

## Socket.io Rooms
- Jeder User joint bei Connect seinen Club-Room: `club:{clubId}`
- Events: `post:created`, `tournament:result`, `match:lineup`

## Quick Commands (vom backend/ Verzeichnis)
```bash
npm run dev           # tsx watch src/server.ts (Hot Reload)
npm test              # Jest – alle 19 Test-Suiten
npm run typecheck     # tsc --noEmit
npm run lint          # ESLint mit max-warnings
npm run db:migrate    # Prisma migrate dev
npm run db:generate   # Prisma Client regenerieren nach Schema-Aenderungen
npm run db:seed       # Seed-Daten laden (tsx prisma/seed.ts)
```

## Test-Patterns
- Alle Tests: `src/__tests__/{entity}.test.ts`
- Setup: `src/__tests__/setup.ts` (Prisma disconnect nach Tests)
- Mocks: `src/__tests__/__mocks__/` (z.B. expo-server-sdk.ts)
- Module-Mapper: `@/` → `src/` (via jest.config.ts moduleNameMapper)
- Neuer Test: Datei in `src/__tests__/{entity}.test.ts` anlegen

## Validation mit Shared Schemas
```typescript
// Route: Zod Schema aus @tennis-club/shared importieren
import { createTeamSchema } from '@tennis-club/shared';
router.post('/', requireAuth, validate(createTeamSchema), handler);
// validate() Middleware parsed und validiert req.body/query/params
```

## Performance
- Batch-Operationen: `prisma.entity.createMany()` statt `Promise.all(items.map(i => prisma.entity.create()))`
- Token-Lookups: Immer per eindeutigem Identifier narrowen, nie Full-Table-Scan + Iteration

## Umgebungsvariablen
Kopiere `backend/.env.example` nach `backend/.env` und passe die Werte an.
JWT Secrets muessen mindestens 32 Zeichen lang sein.
