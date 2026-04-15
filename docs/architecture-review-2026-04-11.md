# Architecture Review — 2026-04-11

> Scope: Strukturelle Hebel, die Entwicklungsgeschwindigkeit in den nächsten 6 Monaten messbar steigern.  
> Methode: Full-Codebase-Read (30+ Files), Pattern-Analyse, Dependency-Tracing.

---

## 1. Route-Handler-Boilerplate eliminieren

### Aktueller Zustand

**113 identische try-catch-Blöcke** über 19 Route-Dateien. Jeder Handler sieht so aus:

```typescript
// backend/src/routes/match.routes.ts:21-28 (und 112 weitere)
async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await someService.doThing(req.params.id, req.user!.clubId);
    success(res, result);
  } catch (err) {
    next(err);
  }
}
```

Das try-catch ist **reines Rauschen** — der `errorHandler` fängt alles. Jeder neue Endpoint = 6 Zeilen Copy-Paste, die nichts tun ausser Fehler weiterzuleiten.

**Betroffene Dateien:** Alle 19 Files in `backend/src/routes/`

### Ziel-Zustand

Ein `asyncHandler`-Wrapper eliminiert das try-catch:

```typescript
// backend/src/utils/asyncHandler.ts
type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;
export const asyncHandler = (fn: AsyncHandler): RequestHandler =>
  (req, res, next) => fn(req, res, next).catch(next);

// Vorher: 6 Zeilen pro Handler
// Nachher:
router.get('/:matchId', validate(matchIdParams, 'params'),
  asyncHandler(async (req, res) => {
    const match = await matchResultService.getMatchDetail(req.params.matchId as string);
    success(res, match);
  })
);
```

### Migrations-Plan

1. `asyncHandler` Utility erstellen (10 Min)
2. Eine Route-Datei migrieren + Tests laufen lassen (Proof of Concept)
3. Restliche 18 Dateien migrieren (mechanisch, keine Logik-Änderungen)
4. ESLint-Rule: Verbiete nackte `async (req, res, next)` ohne Wrapper

### Aufwand: **S** (1-2h mechanische Arbeit)

### Impact

- **~450 Zeilen weniger** Code (113 × 4 Zeilen try/catch/next)
- Neue Endpoints werden schneller geschrieben
- Eliminiert eine ganze Klasse von Bugs (vergessenes `next(err)`)
- Macht Route-Dateien scannbar — reiner Business-Intent

### Risiken

- Minimal. Ist ein etabliertes Express-Pattern. Keine Verhaltensänderung.
- Einziges Risiko: Wenn ein Handler explizit try-catch braucht (z.B. partial error handling), muss das erkannt werden. Aktuell: kein einziger Fall.

---

## 2. Custom Error-Klasse statt `Object.assign(new Error(...))`

### Aktueller Zustand

**60+ Stellen** im Service-Layer werfen Errors via `Object.assign`:

```typescript
// backend/src/services/team.service.ts:53
throw Object.assign(new Error('Team nicht gefunden'), { statusCode: 404, code: 'NOT_FOUND' });

// backend/src/services/matchResult.service.ts:85-87
throw Object.assign(new Error('Ergebnis kann nicht mehr bestaetigt werden'), {
  statusCode: 400,
});

// backend/src/services/ranking.service.ts:135
throw Object.assign(new Error('Beide Spieler muessen in der Rangliste sein'), {
  statusCode: 400,
  code: 'RANKING_PRECONDITION',
});
```

Probleme:
- **Kein TypeScript-Support:** `err.statusCode` existiert nicht auf `Error` — der `errorHandler` castet mit `(err as Error & { statusCode?: number })` (Zeile 70)
- **Inkonsistenz:** Manche Errors haben `code`, manche nicht. Manche nur `statusCode`.
- **Nicht grepbar:** Man kann nicht nach Error-Typen filtern (z.B. "alle 404s finden")
- **Keine Stack-Trace-Garantie:** `Object.assign` kann in manchen Engines die Stack-Trace korrumpieren

### Ziel-Zustand

```typescript
// backend/src/utils/AppError.ts
export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string = 'ERROR',
  ) {
    super(message);
    this.name = 'AppError';
  }

  static notFound(message: string, code = 'NOT_FOUND') {
    return new AppError(message, 404, code);
  }
  static forbidden(message: string, code = 'FORBIDDEN') {
    return new AppError(message, 403, code);
  }
  static badRequest(message: string, code = 'BAD_REQUEST') {
    return new AppError(message, 400, code);
  }
}

// Service: vorher
throw Object.assign(new Error('Team nicht gefunden'), { statusCode: 404, code: 'NOT_FOUND' });
// Service: nachher
throw AppError.notFound('Team nicht gefunden');
```

`errorHandler` wird sauber:

```typescript
if (err instanceof AppError) {
  res.status(err.statusCode).json({
    success: false,
    error: { code: err.code, message: err.message },
  });
  return;
}
```

### Migrations-Plan

1. `AppError` Klasse mit statischen Factory-Methoden erstellen
2. `errorHandler` um `instanceof AppError` erweitern (abwärtskompatibel)
3. Service-Dateien einzeln migrieren (find-replace ist sicher, da Pattern uniform)
4. Alte `Object.assign`-Pattern per ESLint-Custom-Rule verbieten
5. Legacy-Fallback im errorHandler erst entfernen, wenn alle Services migriert sind

### Aufwand: **M** (3-4h, da 60+ Stellen in 15 Service-Dateien)

### Impact

- **Type-Safety:** `err.statusCode` ist jetzt typisiert, kein Casting mehr
- **Consistency:** Jeder Error hat garantiert `statusCode` + `code`
- **Debuggability:** `instanceof AppError` statt Duck-Typing
- **Erweiterbar:** Später einfach `AppError.rateLimit()`, `AppError.conflict()` etc.
- **Zählt 2x:** Räumt sowohl Services als auch errorHandler auf

### Risiken

- Migration muss vollständig sein — halb Object.assign, halb AppError ist schlimmer als nur Object.assign
- Factory-Methoden dürfen nicht zu granular werden (kein `AppError.teamNotFound()` pro Entity)

---

## 3. Socket.io-Kopplung auflösen

### Aktueller Zustand

Socket.io wird **13× per `req.app.get('io')`** in Route-Handlern extrahiert und dann als Parameter durch Service-Funktionen geschleust:

```typescript
// backend/src/routes/event.routes.ts:56-57
const io = req.app.get('io');
const event = await eventService.createEventAndNotify(req.body, req.user!.clubId, req.user!.userId, io);

// backend/src/routes/channel.routes.ts:202
const io = req.app.get('io') as Server | null;
```

Und in Services:
```typescript
// backend/src/services/matchResult.service.ts:263-269
export async function submitResultAndNotify(
  eventId: string, input: ..., submittedById: string,
  clubId: string,
  io: Server | null,  // ← wird durch 4 Funktionsaufrufe durchgereicht
) {
  const result = await submitResult(eventId, input, submittedById);
  if (io) { io.to(SOCKET_ROOMS.club(clubId)).emit('result:submitted', result); }
}
```

Probleme:
- **Jede Service-Funktion** die emitted muss `io: Server | null` als letzten Parameter akzeptieren
- **Duplikation:** `if (io) { io.to(...).emit(...) }` Pattern wiederholt sich
- **Testing:** Services müssen immer mit `null` als io-Parameter getestet werden
- **Kopplung:** Route-Layer kennt Socket.io-Details (`req.app.get('io')`)
- **Composite-Funktionen existieren nur dafür:** `submitResultAndNotify` = `submitResult` + Socket.io emit. Doppelte API-Surface.

### Ziel-Zustand

Event-Emitter-Pattern: Services emittieren Domain-Events, ein zentraler Listener handled Socket.io:

```typescript
// backend/src/events/emitter.ts
import { EventEmitter } from 'node:events';
export const domainEvents = new EventEmitter();

// backend/src/events/socketHandler.ts
export function registerSocketHandlers(io: Server) {
  domainEvents.on('result:submitted', ({ clubId, result }) => {
    io.to(SOCKET_ROOMS.club(clubId)).emit('result:submitted', result);
  });
  domainEvents.on('event:created', ({ clubId, event }) => {
    io.to(SOCKET_ROOMS.club(clubId)).emit('event:created', event);
  });
}

// Service: kein io-Parameter mehr
export async function submitResult(eventId: string, input: ..., submittedById: string) {
  const result = await prisma.matchResult.create(...);
  domainEvents.emit('result:submitted', { clubId: event.clubId, result });
  return result;
}
```

### Migrations-Plan

1. `domainEvents` Emitter + Socket-Listener erstellen
2. Eine Service-Funktion migrieren (z.B. `submitResult`) als Proof of Concept
3. Alle `*AndNotify`-Composite-Funktionen auflösen (Socket-Logik raus)
4. `req.app.get('io')` aus allen Route-Handlern entfernen
5. Typ-Definition für Domain-Events erstellen (typisierter EventEmitter)

### Aufwand: **M** (4-5h)

### Impact

- **Service-Funktionen werden testbar** ohne io-Mocking
- **Route-Handler werden kürzer** (kein `req.app.get('io')` + kein Durchreichen)
- **Composite-Funktionen verschwinden** — statt `submitResult` + `submitResultAndNotify` nur noch `submitResult`
- **Erweiterbar:** Neue Side-Effects (E-Mail, Audit-Log, Analytics) als weitere Listener, ohne Services anzufassen
- **Kein Service muss wissen, dass Socket.io existiert**

### Risiken

- Event-Ordering: Listener werden synchron aufgerufen (EventEmitter default). Für async Listeners `setImmediate` oder Queue nötig.
- Error-Handling in Listeners: Ein fehlender try-catch im Listener crasht den Prozess. Muss im registerSocketHandlers abgefangen werden.
- Overengineering-Gefahr: Nicht zu einem vollen Event-Bus ausbauen. Einfacher typed EventEmitter reicht.

---

## 4. Multi-Tenancy-Lücken schliessen

### Aktueller Zustand

Die CLAUDE.md-Regel "Jede DB-Query MUSS nach clubId filtern" wird **nicht überall eingehalten**:

**Kritische Lücken in `matchResult.service.ts`:**

```typescript
// backend/src/services/matchResult.service.ts:218-242
export async function getMatchDetail(eventId: string) {
  // ⚠️ KEIN clubId-Filter! Jeder authentifizierte User kann jedes Event lesen.
  const event = await prisma.event.findUnique({ where: { id: eventId }, ... });
}

// backend/src/services/matchResult.service.ts:245-255
export async function getResultsForEvent(eventId: string) {
  // ⚠️ KEIN clubId-Filter!
  return prisma.matchResult.findMany({ where: { eventId }, ... });
}

// backend/src/services/matchResult.service.ts:77-78
export async function confirmResult(resultId: string, confirmedById: string) {
  // ⚠️ KEIN clubId-Filter! Findet Result per ID, egal welcher Club.
  const result = await prisma.matchResult.findUnique({ where: { id: resultId } });
}
```

**Auch die Composite-Funktionen sind betroffen:**

```typescript
// backend/src/services/matchResult.service.ts:279
const results = await getResultsForEvent(eventId);  // eventId ohne clubId-Scope
const pending = results.find(r => r.status === 'SUBMITTED');
```

**Route-Ebene:** Die Route `GET /:matchId` (match.routes.ts:18-29) übergibt `req.user!.clubId` nicht an den Service.

**Auch betroffen:** `lineup.service.ts` — `getLineup(eventId)` und `suggestLineup(eventId)` filtern nicht nach clubId.

### Ziel-Zustand

Jede Service-Funktion die eine DB-Query absetzt, nimmt `clubId` als Parameter und filtert:

```typescript
export async function getMatchDetail(eventId: string, clubId: string) {
  const event = await prisma.event.findFirst({
    where: { id: eventId, clubId },  // ← clubId-Filter
    include: { ... }
  });
  if (!event) throw AppError.notFound('Event nicht gefunden');
  return event;
}
```

### Migrations-Plan

1. **Audit:** Jeden Service-Export greppen, der `clubId` nicht als Parameter hat — Liste erstellen
2. **matchResult.service.ts:** `clubId` Parameter zu `getMatchDetail`, `getResultsForEvent`, `confirmResult`, `rejectResult`, `resolveDispute` hinzufügen
3. **lineup.service.ts:** `clubId` zu `getLineup`, `suggestLineup`, `confirmLineup` hinzufügen
4. **Route-Handler:** `req.user!.clubId` an alle betroffenen Service-Aufrufe durchreichen
5. **Test:** Bestehende Tests erweitern — Cross-Club-Zugriff muss 404 zurückgeben

### Aufwand: **M** (3-4h, inkl. Tests)

### Impact

- **Security-Critical:** Ohne Fix kann ein authentifizierter User eines Clubs Daten anderer Clubs lesen
- Aktuell nur 1 Club in Production, aber **bei Skalierung** auf mehrere Clubs ist das ein Data-Breach
- Jede neue Query ohne clubId-Filter erbt die Lücke — exponentielles Wachstum der technischen Schuld
- **Muss vor Multi-Club-Rollout gefixt sein**

### Risiken

- Breaking Change in Service-Signaturen → alle Aufrufer müssen angepasst werden
- Tests die ohne clubId arbeiten, werden brechen (erwünscht — zeigt Lücken auf)
- Kein Risiko in Produktion: Aktuell nur 1 Club. Aber je länger man wartet, desto mehr Code ist betroffen.

---

## 5. Frontend: Service-Layer vereinheitlichen

### Aktueller Zustand

Drei verschiedene Patterns für API-Calls im Frontend, teils in derselben Feature-Domain:

**Pattern A — Dedizierter Service:**
```typescript
// app/src/features/chat/services/chatService.ts
export const chatService = {
  getChannels: () => api.get('/channels').then(r => r.data.data),
  sendMessage: (channelId, data) => api.post(`/channels/${channelId}/messages`, data).then(r => r.data.data),
};

// app/src/features/chat/hooks/useChannels.ts
const { data } = useQuery({ queryKey: ['channels'], queryFn: chatService.getChannels });
```

**Pattern B — Inline in Hook:**
```typescript
// app/src/features/match/hooks/useMatchResult.ts (oder ähnliche)
const { data } = useQuery({
  queryKey: ['matchResults', eventId],
  queryFn: () => api.get(`/matches/${eventId}`).then(r => r.data.data),
});
```

**Pattern C — Mischform:**
```typescript
// Service existiert, aber der Hook baut die URL nochmal zusammen
// oder extrahiert .data.data inline statt über Service
```

**Zusätzliche Inkonsistenzen:**
- Manche Hooks nutzen `getErrorMessage(err, fallback)`, andere nicht
- Query-Key-Naming uneinheitlich: `['channels']` vs `['matchResults', eventId]` vs `['match-detail', id]`
- Invalidation-Patterns variieren: `queryClient.invalidateQueries({ queryKey: ['channels'] })` vs `queryClient.invalidateQueries(['events'])`

### Ziel-Zustand

Ein Pattern für alle Features:

```
Feature/
├── services/entityService.ts    ← Alle API-Calls, pure Functions
├── hooks/useEntity.ts           ← useQuery/useMutation, nutzt Service
└── hooks/useEntityMutation.ts   ← Falls Mutations komplex
```

```typescript
// Service: Pure API-Wrapper, kein React-Import
export const matchService = {
  getDetail: (eventId: string) =>
    api.get<ApiResponse<MatchDetail>>(`/matches/${eventId}`).then(extractData),
  submitResult: (eventId: string, data: SubmitResultInput) =>
    api.post<ApiResponse<MatchResult>>(`/matches/${eventId}/result`, data).then(extractData),
};

// Shared Utility
const extractData = <T>(res: AxiosResponse<ApiResponse<T>>): T => res.data.data;

// Hook: Nur React-Query-Wiring
export function useMatchDetail(eventId: string) {
  return useQuery({
    queryKey: matchKeys.detail(eventId),
    queryFn: () => matchService.getDetail(eventId),
  });
}

// Query Keys: Zentralisiert per Feature
export const matchKeys = {
  all: ['matches'] as const,
  detail: (id: string) => ['matches', 'detail', id] as const,
  results: (eventId: string) => ['matches', 'results', eventId] as const,
};
```

### Migrations-Plan

1. `extractData` Utility erstellen + Query-Key-Factories für 2-3 Feature-Domains
2. Ein Feature vollständig migrieren (z.B. `match/`) als Template
3. Restliche Features migrieren (jeweils: Service → Keys → Hooks)
4. Inline-API-Calls in Hooks per ESLint-Rule verbieten (`no-restricted-imports` für `api` in Hook-Files)
5. `getErrorMessage` einheitlich in alle Mutations einbauen

### Aufwand: **L** (6-8h, 29 Feature-Module betroffen)

### Impact

- **Vorhersagbarkeit:** Neuer Entwickler weiss sofort, wo was hingehört
- **Testbarkeit:** Services sind pure Functions, Hooks sind React-Query-Wiring
- **Refactoring-Sicherheit:** Query-Key-Factories verhindern Invalidation-Bugs
- **Cache-Consistency:** Zentrale Key-Factories = korrektes Invalidieren garantiert
- **Weniger Bugs:** `extractData` eliminiert vergessenes `.data.data`

### Risiken

- Grosser Change, der viele Dateien anfasst — am besten Feature für Feature, nicht Big-Bang
- Query-Key-Migration kann Cache-Probleme verursachen, wenn Alt und Neu parallel existieren
- Muss mit laufender Feature-Entwicklung koordiniert werden

---

## Priorisierungs-Matrix

| # | Verbesserung | Aufwand | Impact | Priorität |
|---|---|---|---|---|
| 4 | Multi-Tenancy-Lücken | M | 🔴 Security-Critical | **SOFORT** |
| 2 | AppError-Klasse | M | Developer Velocity + Type Safety | Hoch |
| 1 | asyncHandler | S | Code Reduction + Consistency | Hoch |
| 3 | Socket.io Entkopplung | M | Testability + Extensibility | Mittel |
| 5 | Frontend Service-Layer | L | Consistency + Onboarding | Mittel |

**Empfohlene Reihenfolge:**
1. **#4 Multi-Tenancy** — Security hat Vorrang, muss vor Multi-Club-Rollout gefixt sein
2. **#2 + #1 zusammen** — AppError + asyncHandler sind komplementär und räumen den gesamten Backend-Code auf
3. **#3 Socket.io** — Kann unabhängig gemacht werden, am besten wenn ein neuer Realtime-Feature geplant ist
4. **#5 Frontend** — Lohnt sich am meisten wenn neue Features kommen; Feature-für-Feature migrieren

---

## Was ich bewusst NICHT aufgelistet habe

- **"Mehr Tests schreiben"** — die Test-Coverage ist bereits solide (19 Test-Suiten, Happy + Error Path)
- **"i18n einführen"** — German-only ist eine bewusste Entscheidung, kein technischer Debt
- **"UI Component Library"** — die interne `components/ui/` ist gut strukturiert, kein Handlungsbedarf
- **"Shared Package aufteilen"** — 33 Files ist handhabbar, Split wäre Premature
- **"State Management wechseln"** — Zustand + React Query ist die richtige Wahl, kein Grund zu ändern
