import * as cheerio from 'cheerio';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

const BASE_URL = 'https://tvm.liga.nu/cgi-bin/WebObjects/nuLigaTENDE.woa/wa';

interface ScrapedTeam {
  name: string;
  league: string;
  captain: string;
  captainPhone: string | null;
  nuligaTeamId: string;
  championship: string;
  rank: number | null;
  points: string | null;
}

interface ScrapedMatch {
  dayOfWeek: string;
  date: string;
  matchNumber: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  isHome: boolean;
  matchPoints: string | null;
  sets: string | null;
  games: string | null;
  status: string;
}

async function fetchPage(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`NuLiga fetch failed: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

export async function scrapeTeams(clubNuligaId: string, season: string = '2026'): Promise<ScrapedTeam[]> {
  const url = `${BASE_URL}/clubTeams?club=${clubNuligaId}&season=${season}`;
  const html = await fetchPage(url);
  const $ = cheerio.load(html);

  const teams: ScrapedTeam[] = [];

  // Zweite result-set Tabelle enthaelt die Mannschaften (erste ist Pokal)
  const tables = $('table.result-set');
  const teamsTable = tables.length > 1 ? tables.eq(1) : tables.eq(0);

  teamsTable.find('tr').each((_i, row) => {
    const cells = $(row).find('td');
    if (cells.length < 5) return;

    // Ueberspringe Header-Rows (table-split, colspan)
    if ($(row).hasClass('table-split')) return;
    const firstCell = cells.eq(0);
    if (firstCell.attr('colspan')) return;

    const teamLink = firstCell.find('a[title="Mannschaftsportrait"]');
    if (!teamLink.length) return;

    const teamName = teamLink.text().trim();
    const href = teamLink.attr('href') || '';

    // Team-ID und Championship aus URL extrahieren
    const teamIdMatch = href.match(/team=(\d+)/);
    const champMatch = href.match(/championship=([^&]+)/);
    const nuligaTeamId = teamIdMatch ? teamIdMatch[1]! : '';
    const championship = champMatch ? decodeURIComponent(champMatch[1]!) : '';

    // Mannschaftsfuehrer (Name + Telefon)
    const captainText = cells.eq(1).text().trim();
    const captainMatch = captainText.match(/^(.+?)\s*\((\d+)\)/);
    const captain = captainMatch ? captainMatch[1]!.trim() : captainText.replace(/\s+/g, ' ');
    const captainPhone = captainMatch ? captainMatch[2]! : null;

    // Liga/Gruppe
    const league = cells.eq(2).text().trim();

    // Tabellen-Rang
    const rankText = cells.eq(3).text().trim();
    const rank = rankText ? parseInt(rankText, 10) || null : null;

    // Punkte
    const points = cells.eq(4).text().trim() || null;

    if (teamName) {
      teams.push({
        name: teamName,
        league,
        captain,
        captainPhone,
        nuligaTeamId,
        championship,
        rank,
        points,
      });
    }
  });

  logger.info(`NuLiga: ${teams.length} Teams gescraped`, { clubNuligaId, season });
  return teams;
}

export async function scrapeMatches(clubNuligaId: string, season: string = '2026'): Promise<ScrapedMatch[]> {
  const url = `${BASE_URL}/clubMeetings?club=${clubNuligaId}&season=${season}`;
  const html = await fetchPage(url);
  const $ = cheerio.load(html);

  const matches: ScrapedMatch[] = [];

  $('table.result-set tr').each((_i, row) => {
    const cells = $(row).find('td');
    // Match-Rows haben mind. 8 Zellen (3 Datum-Spalten + Rest)
    if (cells.length < 8) return;

    const dayOfWeek = cells.eq(0).text().trim();
    const dateTimeText = cells.eq(1).text().trim();
    const matchNumber = cells.eq(3).text().trim();
    const league = cells.eq(4).text().trim();

    // Heim/Auswaerts erkennen: span.route = TC Much ist auswaerts
    const homeCell = cells.eq(5);
    const awayCell = cells.eq(6);
    const hasRoute = homeCell.find('span.route').length > 0;

    const homeTeam = homeCell.find('a').first().find('span.text').length
      ? homeCell.find('a').first().find('span.text').text().trim()
      : homeCell.find('a').first().text().trim();
    const awayTeam = awayCell.find('a').first().text().trim();

    // Ergebnisse
    const matchPoints = cells.eq(7).text().trim() || null;
    const sets = cells.eq(8)?.text().trim() || null;
    const games = cells.eq(9)?.text().trim() || null;
    const status = cells.eq(10)?.text().trim() || 'offen';

    if (dateTimeText && (homeTeam || awayTeam)) {
      matches.push({
        dayOfWeek,
        date: dateTimeText,
        matchNumber,
        league,
        homeTeam: homeTeam || '',
        awayTeam: awayTeam || '',
        isHome: !hasRoute, // Kein Routenplan = TC Much ist Heimteam
        matchPoints: matchPoints && matchPoints !== '\u00a0' ? matchPoints : null,
        sets: sets && sets !== '\u00a0' ? sets : null,
        games: games && games !== '\u00a0' ? games : null,
        status: status.replace(/\s/g, '') || 'offen',
      });
    }
  });

  logger.info(`NuLiga: ${matches.length} Spiele gescraped`, { clubNuligaId, season });
  return matches;
}

function parseNuligaDate(dateStr: string): Date {
  // Format: "02.05.2026 14:30"
  const match = dateStr.match(/(\d{2})\.(\d{2})\.(\d{4})\s*(\d{2}):(\d{2})/);
  if (!match) return new Date();
  const [, day, month, year, hours, minutes] = match;
  return new Date(
    parseInt(year!, 10),
    parseInt(month!, 10) - 1,
    parseInt(day!, 10),
    parseInt(hours!, 10),
    parseInt(minutes!, 10)
  );
}

export async function syncTeamsAndMatches(clubId: string, clubNuligaId: string, season: string = '2026') {
  logger.info('NuLiga Sync gestartet', { clubId, clubNuligaId, season });

  // 1. Teams scrapen und in DB speichern/aktualisieren
  const scrapedTeams = await scrapeTeams(clubNuligaId, season);

  for (const st of scrapedTeams) {
    await prisma.team.upsert({
      where: {
        id: (await prisma.team.findFirst({
          where: { clubId, name: st.name, season },
        }))?.id ?? 'non-existent',
      },
      create: {
        name: st.name,
        league: st.league,
        season,
        clubId,
        type: 'MATCH_TEAM',
      },
      update: {
        league: st.league,
      },
    });
  }

  // 2. Matches scrapen und in DB speichern/aktualisieren
  const scrapedMatches = await scrapeMatches(clubNuligaId, season);

  // Alle DB-Teams laden fuer Zuordnung
  const dbTeams = await prisma.team.findMany({ where: { clubId, season } });

  // Find a system/admin user to use as createdById
  const adminUser = await prisma.userRoleAssignment.findFirst({
    where: { clubId, role: { in: ['CLUB_ADMIN', 'BOARD_MEMBER'] } },
    select: { userId: true },
  });
  const createdById = adminUser?.userId ?? '';

  for (const sm of scrapedMatches) {
    // Match dem richtigen Team zuordnen
    const tcMuchTeamName = sm.isHome ? sm.homeTeam : sm.awayTeam;
    const dbTeam = dbTeams.find(
      (t) => tcMuchTeamName.includes(t.name) || t.name.includes(tcMuchTeamName.replace('TC Much ', ''))
    );
    if (!dbTeam) continue;

    const opponent = sm.isHome ? sm.awayTeam : sm.homeTeam;
    const startDate = parseNuligaDate(sm.date);
    const title = `${dbTeam.name} vs ${opponent}`;

    // Ergebnis-String zusammenbauen
    let resultText: string | null = null;
    if (sm.matchPoints && sm.matchPoints.trim()) {
      resultText = sm.matchPoints;
      if (sm.sets && sm.sets.trim()) resultText += ` (${sm.sets})`;
    }

    const description = resultText ? `Ergebnis: ${resultText}` : null;

    // Upsert basierend auf Team + Datum + Title pattern
    const existing = await prisma.event.findFirst({
      where: {
        teamId: dbTeam.id,
        startDate,
        title: { contains: opponent },
      },
    });

    if (existing) {
      await prisma.event.update({
        where: { id: existing.id },
        data: { description, isHomeGame: sm.isHome },
      });
    } else {
      await prisma.event.create({
        data: {
          title,
          type: 'LEAGUE_MATCH',
          startDate,
          isHomeGame: sm.isHome,
          description,
          teamId: dbTeam.id,
          clubId,
          createdById,
        },
      });
    }
  }

  const totalTeams = scrapedTeams.length;
  const totalMatches = scrapedMatches.length;
  logger.info('NuLiga Sync abgeschlossen', { totalTeams, totalMatches });

  return { teams: totalTeams, matches: totalMatches };
}
