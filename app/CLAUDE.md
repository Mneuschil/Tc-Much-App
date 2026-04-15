# Frontend – Claude Code Hinweise

> Die vollstaendige Wissensdatei liegt in der Root-CLAUDE.md: `../../CLAUDE.md`
> Diese Datei enthaelt nur frontend-spezifische Quick References.

## Quick Commands (vom app/ Verzeichnis)
```bash
npx expo start               # Expo Dev Server
npx expo start --ios          # iOS Simulator
npx expo start --android      # Android Emulator
npm run typecheck             # tsc --noEmit
npm run lint                  # ESLint
```

## Expo Router Routing
- Screens: `app/(tabs)/{route}.tsx` (Tab-Screens)
- Detail: `app/{entity}/[id].tsx` (dynamische Routen)
- Auth: `app/(auth)/` (Login, Register, Welcome)
- Layout: `app/_layout.tsx` (Root), `app/(tabs)/_layout.tsx` (Tab-Navigator)

## Monorepo-Hinweis
Die App liegt in `app/`, Expo Router erwartet Routes in `app/app/`. Das ist korrekt.
Metro Config (`metro.config.js`) loest shared-Package ueber watchFolders auf.
