import { Router } from 'express';
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
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(requireAuth);

// GET / – Alle Teams (optional filter by type)
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const teams = await teamService.getTeamsForClub(req.user!.clubId, req.query.type as string);
    success(res, teams);
  }),
);

// POST / – Neues Team erstellen (Board/Admin) + Auto-Channel
router.post(
  '/',
  requireBoard,
  validate(createTeamSchema),
  asyncHandler(async (req, res) => {
    const team = await teamService.createTeam(req.body, req.user!.clubId, req.user!.userId);
    success(res, team, 201);
  }),
);

// GET /:teamId – Team-Details mit Mitgliedern
router.get(
  '/:teamId',
  validate(teamIdParams, 'params'),
  asyncHandler(async (req, res) => {
    const team = await teamService.getTeamById(req.params.teamId as string, req.user!.clubId);
    success(res, team);
  }),
);

// PUT /:teamId – Team aktualisieren (Board/Admin)
router.put(
  '/:teamId',
  requireBoard,
  validate(teamIdParams, 'params'),
  validate(updateTeamSchema),
  asyncHandler(async (req, res) => {
    const team = await teamService.updateTeam(
      req.params.teamId as string,
      req.user!.clubId,
      req.body,
    );
    success(res, team);
  }),
);

// DELETE /:teamId – Team + Channel loeschen (nur Admin)
router.delete(
  '/:teamId',
  requireAdmin,
  validate(teamIdParams, 'params'),
  asyncHandler(async (req, res) => {
    await teamService.deleteTeam(req.params.teamId as string, req.user!.clubId);
    logAudit('TEAM_DELETED', req.user!.userId, req.user!.clubId, {
      teamId: req.params.teamId as string,
    });
    success(res, { message: 'Team geloescht' });
  }),
);

// POST /:teamId/ensure-channel – Channel sicherstellen (idempotent)
router.post(
  '/:teamId/ensure-channel',
  validate(teamIdParams, 'params'),
  asyncHandler(async (req, res) => {
    const channel = await teamService.ensureTeamChannel(
      req.params.teamId as string,
      req.user!.clubId,
      req.user!.userId,
    );
    success(res, channel);
  }),
);

// POST /:teamId/members – Mitglied hinzufuegen (Board/Admin) + ChannelMember-Sync
router.post(
  '/:teamId/members',
  requireBoard,
  validate(teamIdParams, 'params'),
  validate(addMembersSchema),
  asyncHandler(async (req, res) => {
    const member = await teamService.addTeamMember(
      req.params.teamId as string,
      req.body.userId,
      req.user!.clubId,
      req.body.position,
    );
    success(res, member, 201);
  }),
);

// DELETE /:teamId/members/:userId – Mitglied entfernen (Board/Admin) + ChannelMember-Sync
router.delete(
  '/:teamId/members/:userId',
  requireBoard,
  validate(teamMemberParams, 'params'),
  asyncHandler(async (req, res) => {
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
  }),
);

// PUT /:teamId/members/:userId/position – Position/Rang aktualisieren (Board/Admin)
router.put(
  '/:teamId/members/:userId/position',
  requireBoard,
  validate(teamMemberParams, 'params'),
  validate(updatePositionSchema),
  asyncHandler(async (req, res) => {
    const member = await teamService.updateMemberPosition(
      req.params.teamId as string,
      req.params.userId as string,
      req.user!.clubId,
      req.body.position,
    );
    success(res, member);
  }),
);

export default router;
