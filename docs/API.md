# API-Dokumentation

Base URL: `http://localhost:3000/api/v1`

## Auth
| Method | Endpoint | Beschreibung | Auth |
|--------|----------|-------------|------|
| POST | /auth/register | Registrierung mit Club-Code | Nein |
| POST | /auth/login | Anmeldung | Nein |
| POST | /auth/refresh | Token erneuern | Nein |
| POST | /auth/logout | Abmelden | Ja |

## Channels
| Method | Endpoint | Beschreibung | Auth |
|--------|----------|-------------|------|
| GET | /channels | Alle Channels | Ja |
| POST | /channels | Channel erstellen | Ja (ADMIN) |
| GET | /channels/:id/posts | Posts abrufen | Ja |
| POST | /channels/:id/posts | Post erstellen | Ja |

## Teams
| Method | Endpoint | Beschreibung | Auth |
|--------|----------|-------------|------|
| GET | /teams | Alle Mannschaften | Ja |
| POST | /teams | Mannschaft erstellen | Ja (SPORTWART) |
| GET | /teams/:id | Mannschafts-Details | Ja |

## Matches
| Method | Endpoint | Beschreibung | Auth |
|--------|----------|-------------|------|
| GET | /matches | Alle Spiele | Ja |
| POST | /matches/:id/availability | Verfuegbarkeit melden | Ja |
| POST | /matches/:id/lineup | Aufstellung festlegen | Ja (MF) |

## Turniere
| Method | Endpoint | Beschreibung | Auth |
|--------|----------|-------------|------|
| GET | /tournaments | Alle Turniere | Ja |
| POST | /tournaments | Turnier erstellen | Ja (SPORTWART) |
| POST | /tournaments/:id/register | Anmeldung | Ja |

*Wird mit jedem Feature erweitert.*
