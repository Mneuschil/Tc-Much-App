# Defensive Code Audit — Runtime Crash Risks

**Datum:** 2026-04-10  
**Scope:** Alle .ts/.tsx Source-Files (Frontend, Backend, Shared)  
**Methode:** Systematischer Scan auf NULL/UNDEFINED, ASYNC, TYPE-LIES, EDGE CASES

---

## Zusammenfassung

| Severity | Anzahl |
|----------|--------|
| Critical | 8 |
| High     | 22 |
| Medium   | 20 |

---

## Critical (bekannter Crash-Path)

### C-01 · Division durch 0 in Pagination
**File:** `backend/src/utils/apiResponse.ts:44`  
**Kategorie:** EDGE CASES  
**Szenario:** `Math.ceil(total / limit)` crasht mit `Infinity` wenn `limit=0` — ein Query-Param `?limit=0` genügt.  
**Fix:** `const safeLimit = Math.max(1, limit)` vor der Division.

### C-02 · Division durch 0 in Event-Pagination
**File:** `backend/src/services/event.service.ts:52`  
**Kategorie:** EDGE CASES  
**Szenario:** `Math.ceil(total / limit)` mit `limit=0` aus unkontrolliertem Query-Param erzeugt `Infinity`, Response-Serialisierung bricht.  
**Fix:** `const safeLimit = Math.max(1, Number(limit) || 10)` mit Fallback.

### C-03 · Unsafe Array[0] in Bracket-Service
**File:** `backend/src/services/bracket.service.ts:197`  
**Kategorie:** NULL/UNDEFINED HAZARDS  
**Szenario:** `allMatches[0]` auf leerem Array → `undefined`, nachfolgender Property-Zugriff crasht mit TypeError.  
**Fix:** `if (!allMatches.length) throw new AppError('No matches found', 404)` vor Zugriff.

### C-04 · Null-Zugriff in NuLiga-Sync
**File:** `backend/src/services/nuliga.service.ts:216-217`  
**Kategorie:** NULL/UNDEFINED HAZARDS  
**Szenario:** `dbTeams.find()` gibt `undefined` zurück wenn kein Team matcht, dann `undefined.id` → TypeError crasht den Sync-Job.  
**Fix:** `const dbTeam = dbTeams.find(...); if (!dbTeam) continue;` im Loop.

### C-05 · Null-Zugriff in Training-Service
**File:** `backend/src/services/training.service.ts:105`  
**Kategorie:** NULL/UNDEFINED HAZARDS  
**Szenario:** `training.team` kann null sein wenn Training ohne Team-Zuordnung existiert, Property-Zugriff auf null crasht.  
**Fix:** `if (!training.team) throw new AppError('Training has no team', 404)` Guard.

### C-06 · Unsafe Array-Zugriff in Tournament-Service
**File:** `backend/src/services/tournament.service.ts:197-198`  
**Kategorie:** NULL/UNDEFINED HAZARDS  
**Szenario:** `finalMatch` aus `allMatches[0]` kann `undefined` sein bei leerem Turnier, `finalMatch.winnerId` crasht.  
**Fix:** Early-Return mit Error wenn `allMatches` leer ist.

### C-07 · Null-Winner in Tournament-Service
**File:** `backend/src/services/tournament.service.ts:207-216`  
**Kategorie:** NULL/UNDEFINED HAZARDS  
**Szenario:** `advanceWinner()` kann null zurückgeben, dann `winner.firstName` → TypeError.  
**Fix:** `if (!winner) throw new AppError('Winner not found', 404)`.

### C-08 · Training-Service gibt AxiosPromise statt Data
**File:** `app/src/features/training/services/trainingService.ts:6,14`  
**Kategorie:** TYPE-LIES  
**Szenario:** `getTrainingGroups()` und `setAttendance()` geben raw AxiosResponse statt extrahierte Daten zurück — Caller erwarten `.data`, bekommen aber `{ status, headers, data: { data: ... } }`. Hook crasht beim Zugriff auf falsche Struktur.  
**Fix:** `.then((r) => r.data.data)` wie in allen anderen Services ergänzen.

---

## High (möglicher Crash unter Last / spezifischen Bedingungen)

### H-01 · Non-Null-Assertion auf Route-Params
**File:** `app/app/channel/[id].tsx:64-65`  
**Kategorie:** NULL/UNDEFINED HAZARDS  
**Szenario:** `useChannel(id!)` / `useMessages(id!)` — wenn Deep-Link ohne `id` ankommt, ist `id` undefined → API-Call mit `undefined`.  
**Fix:** Early-Return wenn `!id`, z.B. `if (!id) return <NotFound />`.

### H-02 · Non-Null-Assertion auf Match-Route-Param
**File:** `app/app/match/[id].tsx:97`  
**Kategorie:** NULL/UNDEFINED HAZARDS  
**Szenario:** `useEvent(id!)` mit potenziell undefined Param aus Deep-Link, nachfolgende Zugriffe auf `eventData` ohne Guards.  
**Fix:** Guard: `if (!id) return <NotFound />`.

### H-03 · Non-Null-Assertion auf Tournament-Route-Param
**File:** `app/app/tournament/[id].tsx:61-62`  
**Kategorie:** NULL/UNDEFINED HAZARDS  
**Szenario:** `useTournamentDetail(id!)` und `useBracket(id!)` mit undefiniertem Param, nachfolgendes Casting als `TournamentMatchWithPlayers[]` ohne Validation.  
**Fix:** Guard: `if (!id) return <NotFound />`.

### H-04 · Token-Refresh Destructuring ohne Null-Check
**File:** `app/src/lib/api.ts:72`  
**Kategorie:** NULL/UNDEFINED HAZARDS  
**Szenario:** `data.data.tokens` Destructuring crasht wenn API-Response unerwartet geformt ist (z.B. 200 ohne Body bei Server-Bug).  
**Fix:** `const tokens = data?.data?.tokens; if (!tokens) throw new Error('Invalid refresh response')`.

### H-05 · Race Condition in Token-Refresh Queue
**File:** `app/src/lib/api.ts:78`  
**Kategorie:** ASYNC HAZARDS  
**Szenario:** Bei mehreren gleichzeitigen 401s wird `failedQueue` parallel abgearbeitet. Wenn Refresh fehlschlägt, kann die Queue inkonsistent geleert werden und Requests verloren gehen.  
**Fix:** Queue atomar abarbeiten: `const queue = [...failedQueue]; failedQueue.length = 0; queue.forEach(...)`.

### H-06 · AxiosError-Cast ohne Runtime-Check
**File:** `app/src/utils/errorUtils.ts:8`  
**Kategorie:** TYPE-LIES  
**Szenario:** Error wird als `AxiosError` gecastet ohne `isAxiosError()` Check — bei Nicht-Axios-Errors (z.B. TypeError) werden `.response.data` Zugriffe zu undefined.  
**Fix:** `if (axios.isAxiosError(error)) { ... } else { ... }` Pattern.

### H-07 · Unsafe r.data.data in Calendar-Service
**File:** `app/src/features/calendar/services/calendarService.ts:14`  
**Kategorie:** NULL/UNDEFINED HAZARDS  
**Szenario:** `r.data.data` Zugriff ohne Null-Check — wenn Backend 204 No Content oder fehlerhaften Body liefert, crasht mit TypeError.  
**Fix:** `return r.data?.data ?? []`.

### H-08 · Inkonsistente Response-Extraktion in Calendar-Service
**File:** `app/src/features/calendar/services/calendarService.ts:22`  
**Kategorie:** NULL/UNDEFINED HAZARDS  
**Szenario:** `createEvent()` gibt `r.data` statt `r.data.data` zurück — inkonsistent mit anderen Methoden, Caller bekommt falsches Shape.  
**Fix:** Einheitlich `r.data.data` verwenden oder Return-Types explizit typisieren.

### H-09 · Push-Notification Deep-Property-Zugriff
**File:** `app/src/hooks/usePushNotifications.ts:36`  
**Kategorie:** NULL/UNDEFINED HAZARDS  
**Szenario:** `response.notification.request.content.data` — 4 Ebenen tief ohne Optional-Chaining. Wenn OS eine Notification ohne Content liefert → TypeError.  
**Fix:** `response?.notification?.request?.content?.data` mit Optional-Chaining.

### H-10 · JSON.parse ohne try/catch in Match-Result
**File:** `backend/src/services/matchResult.service.ts:49`  
**Kategorie:** TYPE-LIES  
**Szenario:** `JSON.parse()` auf User-Input (Sets-Array) ohne try/catch — malformed JSON crasht den Request-Handler.  
**Fix:** `try { JSON.parse(sets) } catch { throw new AppError('Invalid sets format', 400) }`.

### H-11 · JSON.parse ohne try/catch in Dispute-Resolution
**File:** `backend/src/services/matchResult.service.ts:192`  
**Kategorie:** TYPE-LIES  
**Szenario:** Zweites `JSON.parse()` auf User-Input ohne Absicherung im gleichen Service.  
**Fix:** Wie H-10.

### H-12 · NaN aus parseInt in NuLiga-Ranking
**File:** `backend/src/services/nuliga.service.ts:83`  
**Kategorie:** EDGE CASES  
**Szenario:** `parseInt(rankText, 10)` gibt NaN wenn gescrapeter Text kein numerischer Wert ist — NaN fließt in DB-Write.  
**Fix:** `const rank = parseInt(rankText, 10); if (isNaN(rank)) continue;`.

### H-13 · Stille Datums-Maskierung in NuLiga
**File:** `backend/src/services/nuliga.service.ts:163`  
**Kategorie:** NULL/UNDEFINED HAZARDS  
**Szenario:** `parseNuligaDate()` gibt `new Date()` als Fallback bei Parse-Fehler zurück — falsches Datum statt Fehler, Events werden mit heutigem Datum angelegt.  
**Fix:** `throw new AppError('Invalid NuLiga date format')` oder `null` zurückgeben und filtern.

### H-14 · NaN aus Query-Params in Event-Routes
**File:** `backend/src/routes/event.routes.ts:27-28`  
**Kategorie:** NULL/UNDEFINED HAZARDS  
**Szenario:** `Number(req.query.page)` / `Number(req.query.limit)` geben NaN bei Nicht-Zahlen, fließen ungeprüft in DB-Query `skip: NaN`.  
**Fix:** `const page = Math.max(1, parseInt(req.query.page as string, 10) || 1)`.

### H-15 · NaN aus Query-Params in User-Routes
**File:** `backend/src/routes/user.routes.ts:61-62`  
**Kategorie:** NULL/UNDEFINED HAZARDS  
**Szenario:** `parseInt()` auf Nicht-Zahlen → NaN in `Math.min/Math.max` → NaN als Pagination-Wert.  
**Fix:** Fallback-Defaults: `const page = parseInt(...) || 1; const limit = parseInt(...) || 20`.

### H-16 · Unvalidierter JWT-Payload in Socket
**File:** `backend/src/socket/handlers.ts:36`  
**Kategorie:** TYPE-LIES  
**Szenario:** `socket.data.user` wird als `TokenPayload` gecastet ohne Runtime-Validation — manipuliertes Token könnte fehlende Felder haben.  
**Fix:** Zod-Schema für TokenPayload, `.safeParse()` in Socket-Auth-Middleware.

### H-17 · Form-Service Status-Transition ohne Guard
**File:** `backend/src/services/form.service.ts:14`  
**Kategorie:** NULL/UNDEFINED HAZARDS  
**Szenario:** `VALID_TRANSITIONS[currentStatus]` gibt `undefined` wenn Status nicht in Map existiert — `.includes()` auf undefined crasht.  
**Fix:** `const allowed = VALID_TRANSITIONS[currentStatus] ?? []; if (!allowed.includes(...))`.

### H-18 · Empty adminUser in NuLiga-Sync
**File:** `backend/src/services/nuliga.service.ts:207-211`  
**Kategorie:** NULL/UNDEFINED HAZARDS  
**Szenario:** `adminUser?.userId` kann leerer String oder undefined sein, fließt als `createdById = ''` in Event-Creation → FK-Constraint-Fehler.  
**Fix:** `if (!adminUser?.userId) throw new AppError('No admin user found for sync')`.

### H-19 · Non-Null-Assertion auf seed in Bracket
**File:** `backend/src/services/bracket.service.ts:55`  
**Kategorie:** NULL/UNDEFINED HAZARDS  
**Szenario:** `a.seed! - b.seed!` in Sort — wenn seed null ist, `null - null = 0` funktioniert zufällig, aber `null - 3 = -3` kann Sortierung korrumpieren.  
**Fix:** `(a.seed ?? Infinity) - (b.seed ?? Infinity)`.

### H-20 · parseInt auf Object.entries-Keys in Bracket
**File:** `backend/src/services/bracket.service.ts:228`  
**Kategorie:** EDGE CASES  
**Szenario:** `parseInt(roundNumber, 10)` auf dynamische Object-Keys — wenn Keys nicht-numerisch sind, NaN propagiert.  
**Fix:** `const num = parseInt(roundNumber, 10); if (isNaN(num)) continue;`.

### H-21 · News-Detail mit undefined State-Init
**File:** `app/app/news/[id].tsx:29-31`  
**Kategorie:** NULL/UNDEFINED HAZARDS  
**Szenario:** `useState(news?.isLiked)` / `useState(news?.comments ?? [])` werden mit undefined initialisiert wenn `news` noch lädt — State bleibt undefined nach dem Laden.  
**Fix:** `useMemo`/`useEffect` um State zu synchronisieren wenn `news` geladen wird.

### H-22 · ResultsSection unsafe array[0]
**File:** `app/src/components/match/ResultsSection.tsx:61`  
**Kategorie:** NULL/UNDEFINED HAZARDS  
**Szenario:** `results[0]?.id` — Optional-Chaining rettet vor Crash, aber `results` selbst könnte undefined sein wenn Props nicht geprüft werden.  
**Fix:** `(results ?? [])[0]?.id` oder Guard am Anfang.

---

## Medium (unsauber, kein direkter Crash)

### M-01 · formatDate mit Invalid Date
**File:** `app/src/utils/formatDate.ts:5`  
**Kategorie:** NULL/UNDEFINED HAZARDS  
**Szenario:** `new Date(date)` mit ungültigem String erzeugt `Invalid Date`, `format()` aus date-fns wirft RangeError.  
**Fix:** `if (isNaN(new Date(date).getTime())) return 'Ungültiges Datum'`.

### M-02 · calendarUtils mit Invalid Date
**File:** `app/src/utils/calendarUtils.ts:45`  
**Kategorie:** NULL/UNDEFINED HAZARDS  
**Szenario:** ISO-String der zu `Invalid Date` parst wird nicht abgefangen.  
**Fix:** Validation vor Verwendung.

### M-03 · useFileUploadFlow uri.split().pop()
**File:** `app/src/features/files/hooks/useFileUploadFlow.ts:17`  
**Kategorie:** NULL/UNDEFINED HAZARDS  
**Szenario:** `uri.split('/').pop()` gibt undefined bei leerem URI, Fallback `'upload'` maskiert Problem.  
**Fix:** Akzeptabel mit Fallback, aber URI-Validation vorschalten.

### M-04 · Expo projectId Fallback
**File:** `app/src/hooks/usePushNotifications.ts:83`  
**Kategorie:** NULL/UNDEFINED HAZARDS  
**Szenario:** `Constants.expoConfig?.extra?.eas?.projectId` undefined → Fallback 'default' → Push-Registration schlägt in Prod still fehl.  
**Fix:** Warnung loggen wenn projectId fehlt.

### M-05 · api.ts config.url Check
**File:** `app/src/lib/api.ts:42`  
**Kategorie:** NULL/UNDEFINED HAZARDS  
**Szenario:** `error.config` existiert aber `config.url` könnte undefined sein.  
**Fix:** `error.config?.url` mit Optional-Chaining.

### M-06 · Token-Refresh Queue bei Fehler
**File:** `app/src/lib/api.ts:54`  
**Kategorie:** ASYNC HAZARDS  
**Szenario:** `isRefreshing` Flag verhindert doppelte Refreshes, aber bei Fehler könnte Queue verwaist bleiben.  
**Fix:** Finally-Block: `isRefreshing = false` in allen Pfaden garantieren.

### M-07 · Push-Notification Cleanup
**File:** `app/src/hooks/usePushNotifications.ts:26`  
**Kategorie:** ASYNC HAZARDS  
**Szenario:** useEffect-Cleanup könnte Listener nicht korrekt entfernen wenn Component während async Registration unmountet.  
**Fix:** AbortController oder isMounted-Flag.

### M-08 · authStore user.roles Null-Chain
**File:** `app/src/stores/authStore.ts:34`  
**Kategorie:** NULL/UNDEFINED HAZARDS  
**Szenario:** `user.roles` mit `?? []` aber `user` selbst könnte null sein.  
**Fix:** `user?.roles ?? []`.

### M-09 · Calendar selectedDate Property-Zugriff
**File:** `app/app/(tabs)/calendar.tsx:57-59`  
**Kategorie:** NULL/UNDEFINED HAZARDS  
**Szenario:** `marks[selectedDate]` ohne Check ob selectedDate gesetzt ist.  
**Fix:** `selectedDate ? marks[selectedDate] : undefined`.

### M-10 · Tournament Date-Parsing
**File:** `app/app/(tabs)/tournaments.tsx:35`  
**Kategorie:** EDGE CASES  
**Szenario:** `differenceInDays()` auf potentiell ungültiges Datum ohne Validation.  
**Fix:** Datum vor Berechnung validieren.

### M-11 · Team Channel-ID auf leerem Array
**File:** `app/app/team/[id].tsx:48`  
**Kategorie:** NULL/UNDEFINED HAZARDS  
**Szenario:** `team?.channels?.[0]?.id` — bei leerem channels-Array wird channelId undefined, Chat-Tab zeigt nichts.  
**Fix:** Fallback-UI wenn kein Channel vorhanden.

### M-12 · Admin Members Roles-Spread
**File:** `app/app/admin/members.tsx:62`  
**Kategorie:** NULL/UNDEFINED HAZARDS  
**Szenario:** `user.roles ?? []` ohne Runtime-Check ob Werte gültige UserRole-Enums sind.  
**Fix:** Zod-Validation auf API-Response.

### M-13 · Login Error-Cast
**File:** `app/app/(auth)/login.tsx:40`  
**Kategorie:** TYPE-LIES  
**Szenario:** Catch-Block castet Error zu spezifischem Type ohne Runtime-Check.  
**Fix:** `axios.isAxiosError()` verwenden.

### M-14 · Register Error-Cast
**File:** `app/app/(auth)/register.tsx:60`  
**Kategorie:** TYPE-LIES  
**Szenario:** Gleicher unsicherer Error-Cast wie in Login.  
**Fix:** Wie M-13.

### M-15 · Stille .catch(() => {}) in Availability-Service
**File:** `backend/src/services/availability.service.ts:186`  
**Kategorie:** ASYNC HAZARDS  
**Szenario:** `lineupService.handleAvailabilityChange().catch(() => {})` schluckt Fehler komplett — Lineup-Inkonsistenzen bleiben unbemerkt.  
**Fix:** `.catch((err) => logger.error('Lineup sync failed', err))`.

### M-16 · Stille .catch(() => {}) in Event Push
**File:** `backend/src/services/event.service.ts:159-171, 191-199`  
**Kategorie:** ASYNC HAZARDS  
**Szenario:** Push-Notification-Fehler werden still geschluckt — bei systematischen Push-Fehlern kein Monitoring.  
**Fix:** Logger im Catch-Block.

### M-17 · Stille .catch(() => {}) in Message Push
**File:** `backend/src/services/message.service.ts:214-226`  
**Kategorie:** ASYNC HAZARDS  
**Szenario:** Push-Fehler bei Nachrichten werden verschluckt.  
**Fix:** Logger im Catch-Block.

### M-18 · Stille .catch(() => {}) in Ranking-Update
**File:** `backend/src/services/matchResult.service.ts:106-114, 204-207`  
**Kategorie:** ASYNC HAZARDS  
**Szenario:** Ranking-Updates nach Match-Ergebnis werden still verschluckt — Ranking kann dauerhaft inkonsistent werden.  
**Fix:** Logger + ggf. Retry-Mechanismus.

### M-19 · DayAgenda endDate ohne Null-Check
**File:** `app/src/components/calendar/DayAgenda.tsx:35-36`  
**Kategorie:** NULL/UNDEFINED HAZARDS  
**Szenario:** `formatTime()` auf optionales `endDate` ohne Null-Guard.  
**Fix:** `event.endDate ? formatTime(event.endDate) : ''`.

### M-20 · Ranking canChallenge ohne Null-Guard
**File:** `app/app/ranking/index.tsx:72-73`  
**Kategorie:** NULL/UNDEFINED HAZARDS  
**Szenario:** `myRank.rank` verglichen ohne Null-Check auf `myRank` innerhalb Callback.  
**Fix:** `myRank?.rank` mit Optional-Chaining.

---

## Statistik nach Kategorie

| Kategorie | Critical | High | Medium | Gesamt |
|-----------|----------|------|--------|--------|
| NULL/UNDEFINED HAZARDS | 5 | 12 | 12 | 29 |
| ASYNC HAZARDS | 0 | 1 | 7 | 8 |
| TYPE-LIES | 1 | 5 | 2 | 8 |
| EDGE CASES | 2 | 4 | 1 | 7 |
| **Gesamt** | **8** | **22** | **20** | **50** |

---

## Empfohlene Priorisierung

1. **Sofort fixen (Critical):** C-01 bis C-08 — bekannte Crash-Paths in Produktion
2. **Sprint-Backlog (High):** H-01 bis H-22 — crashen unter spezifischen Bedingungen (Deep-Links, Edge-Case-Daten, Race Conditions)
3. **Tech-Debt (Medium):** M-01 bis M-20 — unsauber aber kein direkter Crash, stille Fehler verschleiern Probleme
