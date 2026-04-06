import { Router, Request, Response, NextFunction } from 'express';
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

const router = Router();

router.use(requireAuth);

// GET /me – Meine Todos (AC-03)
router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const todos = await todoService.getMyTodos(req.user!.clubId, req.user!.userId);
    success(res, todos);
  } catch (err) {
    next(err);
  }
});

// GET /dashboard – Offene Todos fuer Dashboard (AC-06)
router.get('/dashboard', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const todos = await todoService.getOpenTodosForDashboard(req.user!.clubId, req.user!.userId);
    success(res, todos);
  } catch (err) {
    next(err);
  }
});

// GET / – Todos abrufen (gefiltert nach scope + Berechtigung) (AC-03)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const todos = await todoService.getTodos(
      req.user!.clubId,
      req.user!.userId,
      req.query.scope as string,
      req.query.teamId as string,
      req.user!.roles,
    );
    success(res, todos);
  } catch (err) {
    next(err);
  }
});

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
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const todo = await todoService.createTodo(req.body, req.user!.clubId, req.user!.userId);
      success(res, todo, 201);
    } catch (err) {
      next(err);
    }
  },
);

// PATCH /:todoId/status – Status toggle OPEN↔DONE (AC-04)
router.patch(
  '/:todoId/status',
  validate(toggleTodoStatusSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const todo = await todoService.toggleStatus(
        req.params.todoId as string,
        req.user!.clubId,
        req.body.status,
      );
      success(res, todo);
    } catch (err) {
      next(err);
    }
  },
);

// PUT /:todoId – Todo aktualisieren
router.put(
  '/:todoId',
  validate(updateTodoSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await todoService.updateTodo(req.params.todoId as string, req.user!.clubId, req.body);
      success(res, { message: 'Todo aktualisiert' });
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /:todoId – Todo loeschen
router.delete('/:todoId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await todoService.deleteTodo(req.params.todoId as string, req.user!.clubId);
    success(res, { message: 'Todo geloescht' });
  } catch (err) {
    next(err);
  }
});

export default router;
