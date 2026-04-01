# Project Status – Tennis Club App

## Backend: 18/18 Features ✅
Alle API-Routen, Services, Tests implementiert.

## Frontend: 18/18 Features ✅

### Completed
- F-F01: Expo + Navigation + Theme + 10 UI-Komponenten (Button 4 Varianten, Card, Badge, Avatar, FilterPill, Input, SearchInput, LoadingSkeleton, EmptyState)
- F-F02: Auth Screens (Welcome, Register 3-Step, Login)
- F-F03: API Layer (Axios + Token-Refresh Interceptor + Socket.io Client + Push)
- F-F04: Home/News Feed (PostCard, ChannelPills, PostComposer, Infinite Scroll, Socket.io Live, FAB)
- F-F05: Channel Detail/Chat (MessageBubble, ChatInput, ImageViewer, Reply, OFFICIAL restriction)
- F-F06: Reactions (ReactionPicker 4 Types, ReactionBar, Optimistic Updates)
- F-F07: Teams (TeamCard, MatchCard, RosterRow, Team-Detail mit 3 Segmenten)
- F-F08: Availability (3 Buttons Dabei/Kann nicht/Unsicher, AvailabilityOverview, Deep Link)
- F-F09: Lineup (LineupEditor mit DraggableFlatList, LineupReadonly, Vorschlag laden, Bestätigen)
- F-F10: Calendar (react-native-calendars, multi-dot, AgendaItem mit Farbstripes, RSVP)
- F-F11: Match Result (ScoreInput Satz-für-Satz, ResultConfirm, MatchStatusBadge, Status-basierte Views)
- F-F12: Ranking (RankingRow mit Movement, ChallengeBanner, PlayerDetail Bottom Sheet, ChallengeConfirmModal)
- F-F13: Tournament + Bracket (TournamentCard, BracketView horizontal scrollbar, PartnerPicker, RegisterModal, Socket.io)
- F-F14: Training Attendance (Ja/Nein Buttons, Deadline-Sperre, Trainer-Übersicht)
- F-F15: Todos (TodoCard, Checkbox-Toggle, PATCH Status, Todo-Erstellung)
- F-F16: File Browser (Ordner-Navigation, Upload, Download, Vorschau)
- F-F17: Forms (Platzmeldung mit Foto + Dringlichkeit, Media Upload, Meine Meldungen, Status-Tracking)
- F-F18: Profile + Settings + More Tab (Profil bearbeiten, Avatar-Upload, Channel-Mute, Push-Toggle, Theme-Wahl, Admin Mitglieder-Verwaltung, Logout)

## Architecture
- StyleSheet.create (kein UI-Library)
- Zustand (Client-State) + React Query (Server-State)
- Socket.io Realtime
- Expo Router v4 File-based Routing
- Design: Schwarz für Buttons, Vereinsfarbe nur Akzent, Cards ohne Border/Shadow
- Theme: useTheme() Hook, Light + Dark Mode, Vereinsfarben (#023320, #0EA65A)
