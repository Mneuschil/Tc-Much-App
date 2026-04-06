export interface LineupEntry {
  userId: string;
  position: number;
  isStarter?: boolean;
  user: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
}
