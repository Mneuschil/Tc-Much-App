// ─── Todos (spec section 12) ────────────────────────────────────────

export enum TodoStatus {
  OPEN = 'OPEN',
  DONE = 'DONE',
}

// Spec: "only for: board, trainers, teams"
export enum TodoScope {
  BOARD = 'BOARD',
  TRAINERS = 'TRAINERS',
  TEAM = 'TEAM',
}

// Spec section 12: Fields
export interface Todo {
  id: string;
  title: string;
  description: string | null;
  assigneeId: string;
  dueDate: string | null;
  status: TodoStatus;
  scope: TodoScope;
  teamId: string | null;
  clubId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}
