import { prisma } from '../config/database';

/**
 * Leitet aus Team-Namen den Kurzcode im Vereinsschema ab (D/H + Altersklasse + laufende Nummer).
 *
 * Beispiele:
 *   "Damen 30 1 (4er)"  -> D30     (einzig in D30)
 *   "Herren 40 1"       -> H40-1   (zwei Mannschaften in H40)
 *   "Herren 40 2"       -> H40-2
 *   "Herren 1"          -> H1      (keine Altersklasse)
 *
 * Die Disambiguierung (Suffix -N) greift nur bei mehreren Teams in derselben
 * (Geschlecht, Altersklasse)-Gruppe. Altersklasse = 2+stellige Zahl nach Geschlecht.
 */
export interface ParsedTeamName {
  gender: 'D' | 'H' | null;
  ageClass: number | null;
  teamNum: number | null;
}

export function parseTeamName(name: string): ParsedTeamName {
  const trimmed = name.trim();
  const gender: 'D' | 'H' | null = /^Damen\b/i.test(trimmed)
    ? 'D'
    : /^Herren\b/i.test(trimmed)
      ? 'H'
      : null;
  if (!gender) return { gender: null, ageClass: null, teamNum: null };

  const afterGender = trimmed.replace(/^(Damen|Herren)\s*/i, '');
  const numbers = afterGender.match(/\d+/g)?.map((n) => parseInt(n, 10)) ?? [];
  if (numbers.length === 0) return { gender, ageClass: null, teamNum: null };

  // Altersklasse: erste 2-stellige Zahl >= 18 (z.B. 30, 40, 45)
  const first = numbers[0]!;
  if (first >= 18) {
    return { gender, ageClass: first, teamNum: numbers[1] ?? 1 };
  }
  // Sonst: laufende Nummer ohne Altersklasse (z.B. "Herren 1")
  return { gender, ageClass: null, teamNum: first };
}

interface TeamLike {
  id: string;
  name: string;
}

/**
 * Berechnet für eine Menge von Teams (z.B. alle eines Clubs) die jeweiligen ShortCodes
 * mit Disambiguierung. Teams, deren Namen nicht dem Schema folgen, bekommen null.
 */
export function deriveShortCodes(teams: TeamLike[]): Map<string, string | null> {
  const parsed = teams.map((t) => ({ ...t, parsed: parseTeamName(t.name) }));
  const groupCount = new Map<string, number>();
  for (const t of parsed) {
    if (t.parsed.gender === null) continue;
    const key = `${t.parsed.gender}|${t.parsed.ageClass ?? 'none'}`;
    groupCount.set(key, (groupCount.get(key) ?? 0) + 1);
  }

  const out = new Map<string, string | null>();
  for (const t of parsed) {
    const p = t.parsed;
    if (p.gender === null) {
      out.set(t.id, null);
      continue;
    }
    const key = `${p.gender}|${p.ageClass ?? 'none'}`;
    const count = groupCount.get(key) ?? 1;
    let code = p.gender;
    if (p.ageClass !== null) {
      code += p.ageClass.toString();
      if (count > 1) code += `-${p.teamNum ?? 1}`;
    } else {
      code += `${p.teamNum ?? 1}`;
    }
    out.set(t.id, code);
  }
  return out;
}

/**
 * Liest alle Teams eines Clubs, berechnet ShortCodes, schreibt nur diff.
 * Wird aufgerufen nach Team-Create/Update/Delete (ein neues Team kann die
 * Disambiguierung der anderen Teams derselben Gruppe veraendern).
 */
export async function recomputeClubShortCodes(clubId: string): Promise<void> {
  const teams = await prisma.team.findMany({
    where: { clubId, type: 'MATCH_TEAM' },
    select: { id: true, name: true, shortCode: true },
  });
  const derived = deriveShortCodes(teams);
  const updates: Array<Promise<unknown>> = [];
  for (const t of teams) {
    const next = derived.get(t.id) ?? null;
    if (next !== t.shortCode) {
      updates.push(prisma.team.update({ where: { id: t.id }, data: { shortCode: next } }));
    }
  }
  await Promise.all(updates);
}
