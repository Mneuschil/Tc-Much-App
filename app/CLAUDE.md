# Frontend – Claude Code Hinweise

## Frontend Rules

- React Native + entsprechend letzte genutze Expo SDK version mit router
- TypeScript strict, keine `any` Types
- Alle API-Calls über src/lib/api.ts (Axios Instance mit Token-Refresh)
- Server-State via TanStack React Query (useQuery/useMutation)
- Client-State via Zustand (auth, theme)
- Styling: StyleSheet.create() am Ende jeder Datei
- Farben NUR aus useTheme() Hook, nie hardcoded
- Keine Inline-Styles außer für dynamische Werte
- Jede Komponente in eigener Datei mit Props-Interface
- Loading: Skeleton statt Spinner
- Leere Listen: EmptyState-Komponente
- Pull-to-Refresh auf allen Listen-Screens
- Alle Texte in Deutsch (UI-Sprache)

## App starten
```bash
npx expo start           # Expo Dev Server
npx expo start --ios     # iOS Simulator
npx expo start --android # Android Emulator
```

## Neuen Screen hinzufuegen
1. Datei in `app/` Verzeichnis erstellen (Expo Router file-based routing)
2. Fuer dynamische Routen: `app/entity/[id].tsx`
3. Fuer Tabs: in `app/(tabs)/` ablegen
4. Fuer Auth-geschuetzte Screens: in `app/(tabs)/` (Auth-Guard in Root Layout)

## API-Calls Pattern
```typescript
// IMMER React Query + api.ts Axios Instance verwenden
const { data, isLoading } = useQuery({
  queryKey: ['teams', clubId],
  queryFn: () => api.get('/teams').then(r => r.data),
});

// Mutations
const mutation = useMutation({
  mutationFn: (data) => api.post('/...', data),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['...'] }),
});
```

## Theme verwenden
```typescript
const { colors, spacing, typography } = useTheme();
// colors.background, colors.surface, colors.textPrimary, colors.accent, etc.
```

## Komponenten-Konvention
- Jede Komponente in eigener Datei
- Props als Interface ueber der Komponente
- StyleSheet.create() am Ende der Datei
- Keine Inline-Styles ausser fuer dynamische Werte (z.B. Vereinsfarben)

## Monorepo-Hinweis
Die App liegt in `app/`, Expo Router erwartet Routes in `app/app/`. Das ist korrekt.
Metro Config (`metro.config.js`) loest shared-Package ueber watchFolders auf.

## Design System

### Prinzipien
- Schwarz für primäre Buttons/Headlines, Vereinsfarbe (#023320) nur als Akzent
- Cards: backgroundSecondary (#F5F6F7) Hintergrund, KEIN Border, KEIN Shadow
- Großzügige Radien: Cards 16px, Buttons 12px, Pills 999px
- Viel Whitespace: Screen-Padding 20px, Section-Gaps 24-32px
- System Font, keine Custom Fonts

### Farben (Light)
background: #FFFFFF, backgroundSecondary: #F5F6F7, backgroundTertiary: #EEEFEF
textPrimary: #1A1A1A, textSecondary: #8E8E93, textTertiary: #C4C4C6
accent: #023320, accentLight: #0EA65A, accentSurface: #D1F2EC, accentSubtle: #EDF9F6
buttonPrimary: #1A1A1A, buttonPrimaryText: #FFFFFF
success: #0EA65A, danger: #FF3B30, warning: #FF9500

### Farben (Dark)
background: #0A0A0A, backgroundSecondary: #1C1C1E, backgroundTertiary: #2C2C2E
textPrimary: #F5F5F7, accent: #0EA65A, accentLight: #34D058
buttonPrimary: #F5F5F7, buttonPrimaryText: #0A0A0A

### Komponenten
- Button Primary: bg #1A1A1A, text white, h48, r12
- Button Accent: bg #023320, nur für Haupt-CTAs
- Card: bg #F5F6F7, r16, p16, KEIN border/shadow
- Pill: r999, aktiv #1A1A1A/white, inaktiv #F5F6F7
- Input: bg #F5F6F7, r12, h48, focus border accent
- Avatar: rund, Initialen auf accent bg
- Badge: pill, bg *Surface, text *Farbe
- Tab active: accent, inactive: textTertiary
