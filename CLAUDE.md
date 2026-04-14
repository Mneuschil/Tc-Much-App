# Tennis Vereins-App – Monorepo

> Die vollstaendige Wissensdatei liegt in der Root-CLAUDE.md: `../CLAUDE.md`
> Diese Datei enthaelt nur monorepo-spezifische Ergaenzungen.

## Quick Reference (vom tennis-club/ Verzeichnis)
```bash
npm run validate            # Full: build shared + typecheck + lint + test
npm run build:shared        # Nach shared/ Aenderungen
npm run dev                 # Alle Services parallel starten
npm run db:migrate -w backend   # Prisma Migration
npm run db:seed -w backend      # Seed-Daten
npm run db:studio -w backend    # Prisma Studio
```

## Haeufige Fehlerquellen
1. `shared/` nicht rebuilt nach Type-Aenderung → "Cannot find module" in Backend/App
2. `app/app/` Doppelstruktur ist KORREKT (Workspace-Dir / Expo Router-Dir)
3. Metro Config loest shared via watchFolders auf — KEINE manuellen Symlinks
4. Backend Tests nutzen `src/__tests__/setup.ts` → Prisma disconnect — NICHT entfernen
5. Root `tsconfig.json` ist nur IDE-Fallback — nicht die Build-Config
6. Neue Dependencies nur nach Rueckfrage installieren
