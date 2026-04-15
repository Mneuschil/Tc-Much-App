/**
 * C-04 regression test: syncTeamsAndMatches must not crash when
 * dbTeams.find() returns undefined (no matching team in DB).
 *
 * We mock global fetch to return HTML with matches that don't match any DB team.
 */
import { prisma } from '../config/database';
import { hashPassword } from '../services/auth.service';
import { syncTeamsAndMatches } from '../services/nuliga.service';

const CLUB_CODE = 'NULIGATST';
let clubId: string;

// Minimal HTML that scrapeTeams/scrapeMatches can parse (no actual team data)
const EMPTY_TEAMS_HTML =
  '<html><body><table class="result-set"><tr><td colspan="5">Keine Mannschaften</td></tr></table></body></html>';
const MATCHES_HTML = `<html><body><table class="result-set">
<tr>
  <td>So</td><td>15.06.2026 14:00</td><td></td><td>123</td><td>Bezirksliga</td>
  <td><a><span class="text">Unbekannt FC</span></a></td>
  <td><a>Noch Unbekannter TC</a></td>
  <td>3:6</td><td></td><td></td><td></td>
</tr>
</table></body></html>`;

beforeAll(async () => {
  const passwordHash = await hashPassword('password123');

  const club = await prisma.club.create({
    data: { name: 'NuLiga Test Club', clubCode: CLUB_CODE },
  });
  clubId = club.id;

  await prisma.user.create({
    data: {
      email: 'nuligaadmin@test.de',
      passwordHash,
      firstName: 'Admin',
      lastName: 'NuLiga',
      clubId,
      roles: { create: [{ role: 'CLUB_ADMIN', clubId }] },
    },
  });
});

afterAll(async () => {
  await prisma.event.deleteMany({ where: { clubId } });
  await prisma.team.deleteMany({ where: { clubId } });
  await prisma.userRoleAssignment.deleteMany({ where: { clubId } });
  await prisma.refreshToken.deleteMany({ where: { user: { clubId } } });
  await prisma.user.deleteMany({ where: { clubId } });
  await prisma.club.deleteMany({ where: { clubCode: CLUB_CODE } });
  await prisma.$disconnect();
});

describe('syncTeamsAndMatches (C-04)', () => {
  it('does not crash when scraped match has no matching DB team', async () => {
    // Mock fetch to return HTML with matches but no teams
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockImplementation((url: string) => {
      const body = url.includes('clubTeams') ? EMPTY_TEAMS_HTML : MATCHES_HTML;
      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: () => Promise.resolve(body),
      });
    });

    try {
      // Should not throw — the `if (!dbTeam) continue;` guard skips unmatched matches
      const result = await syncTeamsAndMatches(clubId, 'test-nuliga-id', '2026');
      expect(result.teams).toBe(0);

      // No events should have been created (all matches skipped due to no matching team)
      const events = await prisma.event.findMany({ where: { clubId } });
      expect(events).toHaveLength(0);
    } finally {
      global.fetch = originalFetch;
    }
  });
});
