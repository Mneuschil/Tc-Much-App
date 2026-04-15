import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireBoard } from '../middleware/roles';
import { validate } from '../middleware/validate';
import { courtDamageSchema, mediaUploadSchema } from '@tennis-club/shared';
import * as formService from '../services/form.service';
import { success, error } from '../utils/apiResponse';
import { logAudit } from '../utils/audit';
import { formIdParams } from '../utils/requestSchemas';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(requireAuth);

// POST /court-damage – Platzschaden melden (AC-01: erstellt Meldung + Auto-Todo)
router.post(
  '/court-damage',
  validate(courtDamageSchema),
  asyncHandler(async (req, res) => {
    const submission = await formService.submitCourtDamage(
      req.body,
      req.user!.clubId,
      req.user!.userId,
    );
    logAudit('COURT_DAMAGE_REPORTED', req.user!.userId, req.user!.clubId, {
      formId: submission.id,
    });
    success(res, submission, 201);
  }),
);

// GET /court-damage – Alle Meldungen (AC-03: BOARD/ADMIN only)
router.get(
  '/court-damage',
  requireBoard,
  asyncHandler(async (req, res) => {
    const reports = await formService.getCourtDamageReports(req.user!.clubId);
    success(res, reports);
  }),
);

// GET /court-damage/:formId/status – Status-Tracking fuer User
router.get(
  '/court-damage/:formId/status',
  validate(formIdParams, 'params'),
  asyncHandler(async (req, res) => {
    const form = await formService.getFormStatus(req.params.formId as string, req.user!.clubId);
    if (!form) {
      error(res, 'Formular nicht gefunden', 404, 'NOT_FOUND');
      return;
    }
    success(res, form);
  }),
);

// PATCH /court-damage/:formId/status – Status aktualisieren (AC-04: Push an Melder, AC-06: Flow)
router.patch(
  '/court-damage/:formId/status',
  requireBoard,
  validate(formIdParams, 'params'),
  asyncHandler(async (req, res) => {
    const result = await formService.updateFormStatus(
      req.params.formId as string,
      req.user!.clubId,
      req.body.status,
    );
    logAudit('FORM_STATUS_UPDATED', req.user!.userId, req.user!.clubId, {
      formId: req.params.formId as string,
      status: req.body.status,
    });
    success(res, result);
  }),
);

// POST /media-upload – Media-Upload mit Kategorie/Tag (AC-05)
router.post(
  '/media-upload',
  validate(mediaUploadSchema),
  asyncHandler(async (req, res) => {
    const submission = await formService.submitMediaUpload(
      req.body,
      req.user!.clubId,
      req.user!.userId,
    );
    success(res, submission, 201);
  }),
);

export default router;
