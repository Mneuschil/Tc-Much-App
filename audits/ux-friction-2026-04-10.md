# UX Friction Audit — Tennis Club App

**Datum:** 2026-04-10
**Reviewer:** Claude (Senior Mobile UX Reviewer)
**Zielgruppe:** Tennis-Club-Mitglieder, 14–80 Jahre (viele 60+)
**Primaernutzung:** Schnelle Aktionen unterwegs (Platzbuchung, News, Mannschaftsinfo)
**Design-System:** Custom (Forest Green #023320, Mint #D1F2EC)

---

## Top 15 Issues nach Severity

---

### #1 — Null Accessibility-Labels in der gesamten App

- **Datei:** Alle 28 Screens + alle UI-Komponenten
- **Kategorie:** ALTERS-BARRIEREN
- **Was ist falsch:** Kein einziges `accessibilityLabel`, `accessibilityRole` oder `accessibilityHint` in der gesamten Codebase (0 Treffer bei Grep ueber `/app`).
- **User-Story:** Ein 70-jaehriges Mitglied mit Sehschwaeche aktiviert VoiceOver auf dem iPhone. Kein einziger Button, kein Link, kein Input wird vorgelesen — die App ist komplett unbenutzbar.
- **Severity:** Critical
- **Fix:** Systematisch alle interaktiven Elemente mit Labels versehen. Mindestens:
  - `Button.tsx`: `accessibilityRole="button"` + `accessibilityLabel={title}`
  - `Input.tsx`: `accessibilityLabel={label}` prop durchreichen
  - Alle Icon-only Pressables: `accessibilityLabel` mit Beschreibung (z.B. "Schliessen", "Bearbeiten")
  - `FilterPill.tsx`: `accessibilityRole="button"` + `accessibilityState={{ selected }}`

---

### #2 — Tab-Bar-Labels: 10px Schriftgroesse

- **Datei:** `app/app/(tabs)/_layout.tsx` Zeile 21
- **Kategorie:** ALTERS-BARRIEREN
- **Was ist falsch:** `tabBarLabelStyle: { fontSize: 10 }` — deutlich unter der Mindestgroesse fuer aeltere Nutzer.
- **User-Story:** Ein 65-jaehriges Mitglied versucht zwischen "Kalender" und "Teams" zu wechseln, kann die Labels aber nicht lesen und tippt den falschen Tab an.
- **Severity:** Critical
- **Fix:**
  ```diff
  - tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
  + tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
  ```
  Optimal waeren 13px. Apple HIG empfiehlt min. 11pt fuer Tab Bars, aber bei Zielgruppe 60+ sollte 12–13px Standard sein.

---

### #3 — Caption-Typografie: 11px fuer Timestamps, Ranglisten-Daten, Kalender-Filter

- **Datei:** `app/src/theme/typography.ts` Zeile 12
- **Kategorie:** ALTERS-BARRIEREN
- **Was ist falsch:** `caption: { fontSize: 11 }` wird in Ranking-Screens, Kalender-Filtern, Chat-Timestamps und Benachrichtigungen verwendet — alles kritische Informationen, die fuer aeltere Nutzer unlesbar klein sind.
- **User-Story:** Ein 60-jaehriges Mitglied schaut auf die Rangliste und kann die Bewegungs-Indikatoren (Auf-/Abstieg) nicht erkennen, weil die Zahl in 11px Caption-Text steht.
- **Severity:** Critical
- **Fix:**
  ```diff
  - caption: { fontSize: 11, fontWeight: '500' as const, lineHeight: 14 },
  + caption: { fontSize: 13, fontWeight: '500' as const, lineHeight: 18 },
  ```
  Ebenso `captionMedium` von 12px auf 13px erhoehen.

---

### #4 — Benachrichtigungs-Badge: 9px Schrift

- **Datei:** `app/src/components/home/HeroHeader.tsx` Zeile 214
- **Kategorie:** ALTERS-BARRIEREN
- **Was ist falsch:** `notifBadgeText: { fontSize: 9 }` — die Zahl ungelesener Benachrichtigungen ist fuer die meisten Menschen ueber 50 unsichtbar.
- **User-Story:** Ein 62-jaehriges Mitglied verpasst eine wichtige Mannschafts-Benachrichtigung, weil der Badge mit "3" auf dem Glocken-Icon bei 9px nicht erkennbar ist.
- **Severity:** Critical
- **Fix:**
  ```diff
  - notifBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  + notifBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  ```
  Badge-Container ggf. von 16px auf 18–20px vergroessern.

---

### #5 — Kein Passwort-Sichtbarkeits-Toggle auf Login/Register

- **Datei:** `app/app/(auth)/login.tsx` Zeilen 94–111
- **Kategorie:** FORM-FRIKTION
- **Was ist falsch:** Passwort-Feld hat `secureTextEntry` ohne Toggle-Option. Aeltere Nutzer mit Tipp-Unsicherheit koennen nicht pruefen, ob sie das Passwort korrekt eingegeben haben.
- **User-Story:** Ein 68-jaehriges Mitglied vertippt sich beim Passwort, sieht nur Punkte, bekommt "Anmeldung fehlgeschlagen" und weiss nicht, ob das Passwort falsch war oder ein Tippfehler vorliegt. Nach 3 Versuchen gibt es auf.
- **Severity:** High
- **Fix:** Eye/Eye-off Icon-Button rechts im Input-Feld, der `secureTextEntry` toggled:
  ```tsx
  const [showPassword, setShowPassword] = useState(false);
  // Im TextInput:
  secureTextEntry={!showPassword}
  // Rechts im Input: Pressable mit Ionicons "eye-outline" / "eye-off-outline"
  ```

---

### #6 — "Registrieren"-Link ist plain Text ohne Touch-Target

- **Datei:** `app/app/(auth)/login.tsx` Zeilen 119–124
- **Kategorie:** ALTERS-BARRIEREN
- **Was ist falsch:** Der "Registrieren"-Link ist ein `<Text onPress={...}>` ohne Padding, ohne hitSlop, ohne visuellen Button-Affordance. Touch-Target ist nur die Texthoehe (~18px) und -breite.
- **User-Story:** Ein 72-jaehriges neues Mitglied soll sich registrieren, tippt mehrfach daneben, weil der Touch-Bereich von "Registrieren" nur die exakte Textflaeche ist (ca. 18x80pt).
- **Severity:** High
- **Fix:** `Text` durch `Pressable` mit `hitSlop={16}` und `paddingVertical: 8` ersetzen, oder besser: `Button variant="ghost"` verwenden.

---

### #7 — hitSlop=8 auf Icon-Buttons ist zu klein

- **Datei:** Mehrere — u.a. `forms.tsx:24`, `forms.tsx:38`, `team/[id].tsx:94`, `CreateTodoModal.tsx:313`, `CreateEventModal.tsx:351`, `KaderSheet.tsx:241`, `TodosTab.tsx:76`
- **Kategorie:** ALTERS-BARRIEREN
- **Was ist falsch:** Icon-Buttons (22–24px Icons) mit `hitSlop={8}` ergeben effektive Touch-Targets von ~38–40px — unter dem iOS-Minimum von 44pt.
- **User-Story:** Ein 65-jaehriges Mitglied versucht in der Mannschafts-Ansicht den Zahnrad-Button zum Bearbeiten zu treffen, tippt daneben und oeffnet stattdessen den falschen Screen.
- **Severity:** High
- **Fix:** Alle `hitSlop={8}` auf mindestens `hitSlop={12}` erhoehen (besser: `hitSlop={16}`), damit effektive Touch-Targets >= 44pt erreicht werden. Alternativ: Pressable-Container mit `minWidth: 44, minHeight: 44` stylen.

---

### #8 — Gesamtes Feedback-System basiert auf Alert.alert (blockierend)

- **Datei:** `src/features/todo/hooks/useTodos.ts`, `src/features/calendar/hooks/useEvents.ts`, `src/features/chat/hooks/useMessages.ts`, `src/features/match/hooks/useMatchResult.ts`, `src/features/teams/hooks/useAvailability.ts`
- **Kategorie:** UNKLARE FEEDBACKS
- **Was ist falsch:** Jeder Mutations-Fehler und jede Bestaetigung nutzt `Alert.alert()` — ein modaler Dialog, der die gesamte Interaktion blockiert. Kein Toast/Snackbar-System vorhanden.
- **User-Story:** Ein Mitglied markiert schnell 3 Todos als erledigt. Bei jedem Fehler erscheint ein Alert, den es erst wegtippen muss, bevor es weitermachen kann. Der Flow wird staendig unterbrochen.
- **Severity:** High
- **Fix:** Toast/Snackbar-System implementieren (z.B. eigene Komponente mit Reanimated slide-in). Alerts nur fuer destruktive Aktionen (Loeschen-Bestaetigung) behalten, alles andere als non-blocking Toast.

---

### #9 — ErrorBoundary ignoriert Dark Mode

- **Datei:** `app/src/components/ErrorBoundary.tsx` Zeile 52
- **Kategorie:** FEHLENDE STATES
- **Was ist falsch:** `backgroundColor: lightColors.background` ist hardcoded. Dark-Mode-Nutzer sehen bei einem App-Crash einen blendend weissen Screen.
- **User-Story:** Ein Mitglied nutzt die App nachts im Dark Mode. Die App crashed, und der ErrorBoundary zeigt weissen Hintergrund mit schwarzem Text — blendet und wirkt wie ein voellig anderer Screen.
- **Severity:** High
- **Fix:** `ErrorBoundary` von Class Component zu Function Component migrieren (oder Appearance API nutzen), um `useTheme()` bzw. `useColorScheme()` zu verwenden. Alternativ: Farben per `Appearance.getColorScheme()` ausserhalb von Hooks abfragen.

---

### #10 — Button.tsx nutzt Legacy Animated API statt Reanimated

- **Datei:** `app/src/components/ui/Button.tsx` Zeilen 18–26
- **Kategorie:** UNKLARE FEEDBACKS (Performance)
- **Was ist falsch:** `Animated.spring(scale, ...)` nutzt die alte React Native Animated API. Laut CLAUDE.md/Hard Rules muss immer Reanimated verwendet werden.
- **User-Story:** Auf aelteren Android-Geraeten (haeufig bei 60+ Nutzern) ruckelt die Button-Animation, weil sie nicht auf dem UI-Thread laeuft.
- **Severity:** Medium
- **Fix:**
  ```tsx
  import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';

  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(scale.value) }],
  }));
  ```

---

### #11 — Keine Erfolgs-Rueckmeldung nach Aktionen

- **Datei:** `src/features/todo/hooks/useTodos.ts`, `src/features/teams/hooks/useAvailability.ts`
- **Kategorie:** UNKLARE FEEDBACKS
- **Was ist falsch:** Erfolgreiche Mutationen (Todo erstellt, Verfuegbarkeit geaendert, Event angelegt) geben kein visuelles Feedback — nur die Daten aktualisieren sich still im Hintergrund.
- **User-Story:** Ein 60-jaehriges Mitglied meldet sich fuer ein Mannschaftsspiel als verfuegbar. Es passiert nichts Sichtbares — kein Toast, kein Haekchen, keine Animation. Das Mitglied ist unsicher, ob die Aktion funktioniert hat, und tippt erneut.
- **Severity:** Medium
- **Fix:** Nach erfolgreichen Mutationen einen kurzen Success-Toast anzeigen (z.B. "Verfuegbarkeit gespeichert" mit gruener Akzentfarbe). Optional: Haptic Feedback via `expo-haptics`.

---

### #12 — Login/Register: Kein Auto-Focus auf erstes Feld

- **Datei:** `app/app/(auth)/login.tsx` Zeile 65, `app/app/(auth)/register.tsx`
- **Kategorie:** FORM-FRIKTION
- **Was ist falsch:** Beim Oeffnen des Login-Screens muss der Nutzer manuell ins E-Mail-Feld tippen. Kein `autoFocus` gesetzt.
- **User-Story:** Ein Mitglied oeffnet die App, sieht den Login-Screen und muss erst das E-Mail-Feld antippen, bevor es lostippen kann — ein unnuetiger zusaetzlicher Tap.
- **Severity:** Medium
- **Fix:**
  ```diff
  <TextInput
  + autoFocus
    value={email}
    onChangeText={setEmail}
  ```

---

### #13 — Keine Inline-Validierung in Auth-Formularen

- **Datei:** `app/app/(auth)/login.tsx` Zeilen 28–31, `app/app/(auth)/register.tsx`
- **Kategorie:** FORM-FRIKTION
- **Was ist falsch:** Validierungsfehler werden erst beim Submit via `Alert.alert()` angezeigt. Keine Inline-Fehlermeldungen unter den Feldern, kein visuelles Feedback waehrend der Eingabe.
- **User-Story:** Ein 66-jaehriges Mitglied gibt eine ungueltige E-Mail ein (vergisst das @), tippt auf "Anmelden", bekommt einen modalen Alert "Fehler" und muss zurueck zum Feld navigieren — ohne zu sehen, welches Feld den Fehler hat.
- **Severity:** Medium
- **Fix:** Die `Input`-Komponente (die bereits `error`-Props unterstuetzt) anstelle von rohen `TextInput`-Elementen verwenden. Validierung inline unter dem jeweiligen Feld anzeigen, z.B. "Bitte gueltige E-Mail eingeben".

---

### #14 — textSecondary (#8E8E93) auf weissem Hintergrund: schwacher Kontrast

- **Datei:** `app/src/theme/colors.ts` Zeile 11
- **Kategorie:** ALTERS-BARRIEREN
- **Was ist falsch:** `textSecondary: '#8E8E93'` auf `background: '#FFFFFF'` ergibt ein Kontrast-Verhaeltnis von ca. 3.5:1 — knapp unter WCAG AA (4.5:1 fuer normalen Text). Wird intensiv fuer Labels, Timestamps und Sekundaer-Infos genutzt.
- **User-Story:** Ein 70-jaehriges Mitglied kann auf dem Kalender-Screen die Uhrzeiten der Termine kaum lesen, weil der hellgraue Text auf weissem Hintergrund zu wenig Kontrast bietet.
- **Severity:** Medium
- **Fix:**
  ```diff
  - textSecondary: '#8E8E93',
  + textSecondary: '#6C6C70',
  ```
  Neuer Wert ergibt ca. 5.5:1 Kontrast — erfuellt WCAG AA und bleibt visuell als Sekundaertext erkennbar.

---

### #15 — Match-Screen: Mehrstufiger Flow ohne Fortschrittsanzeige

- **Datei:** `app/app/match/[id].tsx`
- **Kategorie:** NAVIGATIONS-FALLEN
- **Was ist falsch:** Der Match-Screen umfasst Verfuegbarkeit, Aufstellung und Ergebnis in einem Screen mit Tabs — aber ohne Fortschrittsbalken oder Step-Indicator. Nutzer wissen nicht, wo sie im Prozess sind.
- **User-Story:** Ein Mannschaftsfuehrer (58 Jahre) will das Spielergebnis eintragen, findet aber den Ergebnis-Tab nicht, weil die Tab-Navigation innerhalb des Screens nicht als solche erkennbar ist. Er navigiert zurueck und sucht einen separaten "Ergebnis"-Screen.
- **Severity:** Medium
- **Fix:** Step-Indicator am oberen Rand des Screens hinzufuegen (z.B. 3 Kreise: "Verfuegbarkeit" > "Aufstellung" > "Ergebnis") mit aktiver Markierung des aktuellen Schritts.

---

## Zusammenfassung nach Severity

| Severity | Anzahl | Issues |
|----------|--------|--------|
| Critical | 4 | #1 Accessibility, #2 Tab-Labels, #3 Caption-Font, #4 Badge-Font |
| High | 5 | #5 Passwort-Toggle, #6 Register-Link, #7 hitSlop, #8 Alert-System, #9 ErrorBoundary Dark Mode |
| Medium | 6 | #10 Legacy Animated, #11 Erfolgs-Feedback, #12 Auto-Focus, #13 Inline-Validierung, #14 Kontrast, #15 Step-Indicator |

## Empfohlene Reihenfolge

1. **Sprint 1 (Critical):** Accessibility-Labels, Typography-Scale anpassen (Caption, Tab-Labels, Badge)
2. **Sprint 2 (High):** Toast-System bauen, Passwort-Toggle, Touch-Targets fixen, ErrorBoundary Dark Mode
3. **Sprint 3 (Medium):** Button auf Reanimated migrieren, Inline-Validierung, Kontrast-Fix, Erfolgs-Feedback, Step-Indicator
