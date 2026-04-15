import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireAnyRole } from '../middleware/roles';
import { validate } from '../middleware/validate';
import {
  createTodoSchema,
  updateTodoSchema,
  toggleTodoStatusSchema,
  UserRole,
} from '@tennis-club/shared';
import * as todoService from '../services/todo.service';
import { success } from '../utils/apiResponse';
import { todoIdParams } from '../utils/requestSchemas';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(requireAuth);

// GET /me – Meine Todos (AC-03)
router.get(
  '/me',
  asyncHandler(async (req, res) => {
    const todos = await todoService.getMyTodos(req.user!.clubId, req.user!.userId);
    success(res, todos);
  }),
);

// GET /dashboard – Offene Todos fuer Dashboard (AC-06)
router.get(
  '/dashboard',
  asyncHandler(async (req, res) => {
    const todos = await todoService.getOpenTodosForDashboard(req.user!.clubId, req.user!.userId);
    success(res, todos);
  }),
);

// GET / – Todos abrufen (gefiltert nach scope + Berechtigung) (AC-03)
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const todos = await todoService.getTodos(
      req.user!.clubId,
      req.user!.userId,
      req.query.scope as string,
      req.query.teamId as string,
      req.user!.roles,
    );
    success(res, todos);
  }),
);

// POST / – Todo erstellen (AC-01: BOARD/TRAINER/ADMIN only)
router.post(
  '/',
  requireAnyRole([
    UserRole.BOARD_MEMBER,
    UserRole.TRAINER,
    UserRole.TEAM_CAPTAIN,
    UserRole.CLUB_ADMIN,
    UserRole.SYSTEM_ADMIN,
  ]),
  validate(createTodoSchema),
  asyncHandler(async (req, res) => {
    const todo = await todoService.createTodo(req.body, req.user!.clubId, req.user!.userId);
    success(res, todo, 201);
  }),
);

// PATCH /:todoId/status – Status toggle OPEN↔DONE (AC-04)
router.patch(
  '/:todoId/status',
  validate(todoIdParams, 'params'),
  validate(toggleTodoStatusSchema),
  asyncHandler(async (req, res) => {
    const todo = await todoService.toggleStatus(
      req.params.todoId as string,
      req.user!.clubId,
      req.body.status,
    );
    success(res, todo);
  }),
);

// PUT /:todoId – Todo aktualisieren
router.put(
  '/:todoId',
  validate(todoIdParams, 'params'),
  validate(updateTodoSchema),
  asyncHandler(async (req, res) => {
    await todoService.updateTodo(req.params.todoId as string, req.user!.clubId, req.body);
    success(res, { message: 'Todo aktualisiert' });
  }),
);

// DELETE /:todoId – Todo loeschen
router.delete(
  '/:todoId',
  validate(todoIdParams, 'params'),
  asyncHandler(async (req, res) => {
    await todoService.deleteTodo(req.params.todoId as string, req.user!.clubId);
    success(res, { message: 'Todo geloescht' });
  }),
);

export default router;
