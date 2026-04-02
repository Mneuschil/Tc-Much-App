/**
 * Mock events for UI development — remove once real data is available.
 */

interface MockEvent {
  id: string;
  title: string;
  type: string;
  startDate: string;
  endDate: string | null;
  description: string | null;
  location: string | null;
  court: string | null;
  isHomeGame: boolean | null;
  team: { id: string; name: string } | null;
}

function getMonday(): Date {
  const now = new Date();
  const day = now.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + offset);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function dayAt(dayOffset: number, hour: number, minute = 0): string {
  const d = getMonday();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export function generateMockWeekEvents(): MockEvent[] {
  return [
    // Montag (0)
    {
      id: 'mock-1',
      title: 'Training Jugend U14',
      type: 'TRAINING',
      startDate: dayAt(0, 16, 0),
      endDate: dayAt(0, 17, 30),
      description: null,
      location: 'TC Much',
      court: '1',
      isHomeGame: null,
      team: { id: 't1', name: 'Jugend U14' },
    },
    {
      id: 'mock-2',
      title: 'Training Damen',
      type: 'TRAINING',
      startDate: dayAt(0, 18, 0),
      endDate: dayAt(0, 19, 30),
      description: null,
      location: 'TC Much',
      court: '2',
      isHomeGame: null,
      team: { id: 't2', name: 'Damen 40' },
    },

    // Dienstag (1)
    {
      id: 'mock-3',
      title: 'Ranglistenspiel Müller vs. Schmidt',
      type: 'RANKING_MATCH',
      startDate: dayAt(1, 17, 0),
      endDate: dayAt(1, 18, 30),
      description: null,
      location: 'TC Much',
      court: '3',
      isHomeGame: null,
      team: null,
    },
    {
      id: 'mock-4',
      title: 'Training Herren',
      type: 'TRAINING',
      startDate: dayAt(1, 18, 0),
      endDate: dayAt(1, 19, 30),
      description: null,
      location: 'TC Much',
      court: '1',
      isHomeGame: null,
      team: { id: 't3', name: 'Herren 30' },
    },

    // Mittwoch (2)
    {
      id: 'mock-5',
      title: 'Training Bambini',
      type: 'TRAINING',
      startDate: dayAt(2, 15, 0),
      endDate: dayAt(2, 16, 0),
      description: null,
      location: 'TC Much',
      court: '1',
      isHomeGame: null,
      team: { id: 't4', name: 'Bambini' },
    },

    // Donnerstag (3) — "heute" bei normalem Verlauf
    {
      id: 'mock-6',
      title: 'Herren 30 vs. TC Overath',
      type: 'LEAGUE_MATCH',
      startDate: dayAt(3, 14, 0),
      endDate: null,
      description: null,
      location: 'TC Much',
      court: null,
      isHomeGame: true,
      team: { id: 't3', name: 'Herren 30' },
    },
    {
      id: 'mock-7',
      title: 'Training Jugend U14',
      type: 'TRAINING',
      startDate: dayAt(3, 16, 30),
      endDate: dayAt(3, 18, 0),
      description: null,
      location: 'TC Much',
      court: '2',
      isHomeGame: null,
      team: { id: 't1', name: 'Jugend U14' },
    },
    {
      id: 'mock-8',
      title: 'Ranglistenspiel Weber vs. Becker',
      type: 'RANKING_MATCH',
      startDate: dayAt(3, 18, 30),
      endDate: dayAt(3, 20, 0),
      description: null,
      location: 'TC Much',
      court: '3',
      isHomeGame: null,
      team: null,
    },

    // Freitag (4)
    {
      id: 'mock-9',
      title: 'Damen 40 vs. TC Bergheim',
      type: 'CUP_MATCH',
      startDate: dayAt(4, 16, 0),
      endDate: null,
      description: null,
      location: 'TC Bergheim',
      court: null,
      isHomeGame: false,
      team: { id: 't2', name: 'Damen 40' },
    },
    {
      id: 'mock-10',
      title: 'Training Herren',
      type: 'TRAINING',
      startDate: dayAt(4, 18, 0),
      endDate: dayAt(4, 19, 30),
      description: null,
      location: 'TC Much',
      court: '1',
      isHomeGame: null,
      team: { id: 't3', name: 'Herren 30' },
    },

    // Samstag (5)
    {
      id: 'mock-11',
      title: 'Clubmeisterschaft Einzel',
      type: 'CLUB_CHAMPIONSHIP',
      startDate: dayAt(5, 10, 0),
      endDate: dayAt(5, 18, 0),
      description: null,
      location: 'TC Much',
      court: null,
      isHomeGame: null,
      team: null,
    },
    {
      id: 'mock-12',
      title: 'Saisonstart-Grillen',
      type: 'CLUB_EVENT',
      startDate: dayAt(5, 18, 0),
      endDate: dayAt(5, 22, 0),
      description: null,
      location: 'TC Much Clubhaus',
      court: null,
      isHomeGame: null,
      team: null,
    },

    // Sonntag (6)
    {
      id: 'mock-13',
      title: 'Clubmeisterschaft Doppel',
      type: 'CLUB_CHAMPIONSHIP',
      startDate: dayAt(6, 10, 0),
      endDate: dayAt(6, 16, 0),
      description: null,
      location: 'TC Much',
      court: null,
      isHomeGame: null,
      team: null,
    },
  ];
}
