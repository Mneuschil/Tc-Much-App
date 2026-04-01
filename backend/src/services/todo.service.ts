import { prisma } from '../config/database';
import type { CreateTodoInput, UpdateTodoInput } from '@tennis-club/shared';
import * as pushService from './push.service';

// Spec section 12: Todos only for board, trainers, teams

export async function getTodos(clubId: string, userId: string, scope?: string, teamId?: string) {
  return prisma.todo.findMany({
    where: {
      clubId,
      ...(scope ? { scope: scope as 'BOARD' | 'TRAINERS' | 'TEAM' } : {}),
      ...(teamId ? { teamId } : {}),
      OR: [
        { assigneeId: userId },
        { createdById: userId },
      ],
    },
    include: {
      assignee: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      team: { select: { id: true, name: true } },
    },
    orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
  });
}

export async function getMyTodos(clubId: string, userId: string) {
  return prisma.todo.findMany({
    where: { clubId, assigneeId: userId },
    include: {
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      team: { select: { id: true, name: true } },
    },
    orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
  });
}

export async function createTodo(input: CreateTodoInput, clubId: string, createdById: string) {
  const todo = await prisma.todo.create({
    data: {
      title: input.title,
      description: input.description,
      assigneeId: input.assigneeId,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      scope: input.scope as 'BOARD' | 'TRAINERS' | 'TEAM',
      teamId: input.teamId,
      clubId,
      createdById,
    },
    include: {
      assignee: { select: { id: true, firstName: true, lastName: true } },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  // Push to assignee if different from creator
  if (input.assigneeId !== createdById) {
    await pushService.sendToUsers([input.assigneeId], {
      title: 'Neues Todo',
      body: `${todo.createdBy.firstName} ${todo.createdBy.lastName} hat dir "${todo.title}" zugewiesen.`,
      data: { todoId: todo.id },
    });
  }

  return todo;
}

export async function toggleStatus(todoId: string, clubId: string, status: 'OPEN' | 'DONE') {
  const todo = await prisma.todo.findFirst({ where: { id: todoId, clubId } });
  if (!todo) {
    throw Object.assign(new Error('Todo nicht gefunden'), { statusCode: 404 });
  }

  return prisma.todo.update({
    where: { id: todoId },
    data: { status },
    include: {
      assignee: { select: { id: true, firstName: true, lastName: true } },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      team: { select: { id: true, name: true } },
    },
  });
}

export async function getOpenTodosForDashboard(clubId: string, userId: string) {
  return prisma.todo.findMany({
    where: {
      clubId,
      assigneeId: userId,
      status: 'OPEN',
    },
    include: {
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      team: { select: { id: true, name: true } },
    },
    orderBy: { dueDate: 'asc' },
    take: 10,
  });
}

export async function updateTodo(todoId: string, clubId: string, input: UpdateTodoInput) {
  return prisma.todo.updateMany({
    where: { id: todoId, clubId },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.assigneeId !== undefined ? { assigneeId: input.assigneeId } : {}),
      ...(input.dueDate !== undefined ? { dueDate: new Date(input.dueDate) } : {}),
      ...(input.status !== undefined ? { status: input.status as 'OPEN' | 'DONE' } : {}),
    },
  });
}

export async function deleteTodo(todoId: string, clubId: string) {
  return prisma.todo.deleteMany({ where: { id: todoId, clubId } });
}
