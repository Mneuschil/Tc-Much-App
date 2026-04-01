// ─── Match System (spec section 8) ──────────────────────────────────

// Spec: "Player A submits → Player B confirms/rejects → dispute → sports manager"
export enum MatchResultStatus {
  SUBMITTED = 'SUBMITTED',
  CONFIRMED = 'CONFIRMED',
  REJECTED = 'REJECTED',
  DISPUTED = 'DISPUTED',
}

// Spec: "full tennis scoring (sets, games, tiebreak)"
export interface TennisSet {
  games1: number;
  games2: number;
  tiebreak1: number | null;
  tiebreak2: number | null;
}

export interface MatchResult {
  id: string;
  eventId: string;
  submittedById: string;
  confirmedById: string | null;
  status: MatchResultStatus;
  sets: TennisSet[];
  winnerId: string | null;
  rejectionReason: string | null;
  disputeNote: string | null;
  resolvedById: string | null;
  createdAt: string;
  updatedAt: string;
}
