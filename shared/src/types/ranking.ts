// ─── Ranking System (spec section 9) ────────────────────────────────

export interface Ranking {
  id: string;
  clubId: string;
  userId: string;
  rank: number;
  previousRank: number | null;  // Spec: "movement indicators (up/down)"
  points: number;
  wins: number;
  losses: number;
  isManual: boolean;            // Spec: "initial manual ranking"
  createdAt: string;
  updatedAt: string;
}
