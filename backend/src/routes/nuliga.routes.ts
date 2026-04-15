import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireAnyRole } from '../middleware/roles';
import { UserRole } from '@tennis-club/shared';
import { syncTeamsAndMatches, scrapeTeams, scrapeMatches } from '../services/nuliga.service';
import { success, error } from '../utils/apiResponse';
import { prisma } from '../config/database';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(requireAuth);

// POST /sync – NuLiga Daten synchronisieren (nur Admin/Sportwart)
router.post(
  '/sync',
  requireAnyRole([UserRole.CLUB_ADMIN, UserRole.BOARD_MEMBER]),
  asyncHandler(async (req, res) => {
    const club = await prisma.club.findUnique({ where: { id: req.user!.clubId } });
    if (!club) {
      error(res, 'Club nicht gefunden', 404, 'NOT_FOUND');
      return;
    }

    if (!club.nuligaClubId) {
      error(res, 'NuLiga Club-ID ist nicht konfiguriert', 400, 'NULIGA_NOT_CONFIGURED');
      return;
    }

    const season = (req.body.season as string) || '2026';
    const result = await syncTeamsAndMatches(req.user!.clubId, club.nuligaClubId, season);
    success(res, {
      message: `Sync abgeschlossen: ${result.teams} Teams, ${result.matches} Spiele`,
      ...result,
    });
  }),
);

// GET /preview/teams – Vorschau: Teams von NuLiga abrufen (ohne DB-Import)
router.get(
  '/preview/teams',
  asyncHandler(async (req, res) => {
    const club = await prisma.club.findUnique({ where: { id: req.user!.clubId } });
    if (!club?.nuligaClubId) {
      error(res, 'NuLiga Club-ID ist nicht konfiguriert', 400, 'NULIGA_NOT_CONFIGURED');
      return;
    }
    const season = (req.query.season as string) || '2026';
    const teams = await scrapeTeams(club.nuligaClubId, season);
    success(res, teams);
  }),
);

// GET /preview/matches – Vorschau: Spiele von NuLiga abrufen (ohne DB-Import)
router.get(
  '/preview/matches',
  asyncHandler(async (req, res) => {
    const club = await prisma.club.findUnique({ where: { id: req.user!.clubId } });
    if (!club?.nuligaClubId) {
      error(res, 'NuLiga Club-ID ist nicht konfiguriert', 400, 'NULIGA_NOT_CONFIGURED');
      return;
    }
    const season = (req.query.season as string) || '2026';
    const matches = await scrapeMatches(club.nuligaClubId, season);
    success(res, matches);
  }),
);

export default router;
