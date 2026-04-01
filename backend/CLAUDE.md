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

## Umgebungsvariablen
Kopiere `backend/.env.example` nach `backend/.env` und passe die Werte an.
JWT Secrets muessen mindestens 32 Zeichen lang sein.
