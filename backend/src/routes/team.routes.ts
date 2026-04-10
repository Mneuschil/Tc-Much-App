import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireBoard, requireAdmin } from '../middleware/roles';
import { validate } from '../middleware/validate';
import {
  createTeamSchema,
  updateTeamSchema,
  addMembersSchema,
  updatePositionSchema,
} from '@tennis-club/shared';
import * as teamService from '../services/team.service';
import { success } from '../utils/apiResponse';
import { logAudit } from '../utils/audit';
import { teamIdParams, teamMemberParams } from '../utils/requestSchemas';

const router = Router();

router.use(requireAuth);

// GET / – Alle Teams (optional filter by type)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const teams = await teamService.getTeamsForClub(req.user!.clubId, req.query.type as string);
    success(res, teams);
  } catch (err) {
    next(err);
  }
});

// POST / – Neues Team erstellen (Board/Admin) + Auto-Channel
router.post(
  '/',
  requireBoard,
  validate(createTeamSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const team = await teamService.createTeam(req.body, req.user!.clubId, req.user!.userId);
      success(res, team, 201);
    } catch (err) {
      next(err);
    }
  },
);

// GET /:teamId – Team-Details mit Mitgliedern
router.get(
  '/:teamId',
  validate(teamIdParams, 'params'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const team = await teamService.getTeamById(req.params.teamId as string, req.user!.clubId);
      success(res, team);
    } catch (err) {
      next(err);
    }
  },
);

// PUT /:teamId – Team aktualisieren (Board/Admin)
router.put(
  '/:teamId',
  requireBoard,
  validate(teamIdParams, 'params'),
  validate(updateTeamSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const team = await teamService.updateTeam(
        req.params.teamId as string,
        req.user!.clubId,
        req.body,
      );
      success(res, team);
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /:teamId – Team + Channel loeschen (nur Admin)
router.delete(
  '/:teamId',
  requireAdmin,
  validate(teamIdParams, 'params'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await teamService.deleteTeam(req.params.teamId as string, req.user!.clubId);
      logAudit('TEAM_DELETED', req.user!.userId, req.user!.clubId, {
        teamId: req.params.teamId as string,
      });
      success(res, { message: 'Team geloescht' });
    } catch (err) {
      next(err);
    }
  },
);

// POST /:teamId/ensure-channel – Channel sicherstellen (idempotent)
router.post(
  '/:teamId/ensure-channel',
  validate(teamIdParams, 'params'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const channel = await teamService.ensureTeamChannel(
        req.params.teamId as string,
        req.user!.clubId,
        req.user!.userId,
      );
      success(res, channel);
    } catch (err) {
      next(err);
    }
  },
);

// POST /:teamId/members – Mitglied hinzufuegen (Board/Admin) + ChannelMember-Sync
router.post(
  '/:teamId/members',
  requireBoard,
  validate(teamIdParams, 'params'),
  validate(addMembersSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const member = await teamService.addTeamMember(
        req.params.teamId as string,
        req.body.userId,
        req.user!.clubId,
        req.body.position,
      );
      success(res, member, 201);
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /:teamId/members/:userId – Mitglied entfernen (Board/Admin) + ChannelMember-Sync
router.delete(
  '/:teamId/members/:userId',
  requireBoard,
  validate(teamMemberParams, 'params'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await teamService.removeTeamMember(
        req.params.teamId as string,
        req.params.userId as string,
        req.user!.clubId,
      );
      logAudit('TEAM_MEMBER_REMOVED', req.user!.userId, req.user!.clubId, {
        teamId: req.params.teamId as string,
        removedUserId: req.params.userId as string,
      });
      success(res, { message: 'Mitglied entfernt' });
    } catch (err) {
      next(err);
    }
  },
);

// PUT /:teamId/members/:userId/position – Position/Rang aktualisieren (Board/Admin)
router.put(
  '/:teamId/members/:userId/position',
  requireBoard,
  validate(teamMemberParams, 'params'),
  validate(updatePositionSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const member = await teamService.updateMemberPosition(
        req.params.teamId as string,
        req.params.userId as string,
        req.user!.clubId,
        req.body.position,
      );
      success(res, member);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
