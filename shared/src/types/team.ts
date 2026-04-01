// ─── Teams Module (spec section 6) ──────────────────────────────────

// Spec: "Teams (match teams), Training groups, Board groups"
export enum TeamType {
  MATCH_TEAM = 'MATCH_TEAM',
  TRAINING_GROUP = 'TRAINING_GROUP',
  BOARD_GROUP = 'BOARD_GROUP',
}

// Spec section 10: "available / not available / maybe"
export enum AvailabilityStatus {
  AVAILABLE = 'AVAILABLE',
  NOT_AVAILABLE = 'NOT_AVAILABLE',
  MAYBE = 'MAYBE',
}

export interface Team {
  id: string;
  name: string;
  type: TeamType;
  league: string | null;
  season: string | null;
  clubId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  position: number | null;
  createdAt: string;
}

// Spec section 10: Availability per event
export interface Availability {
  id: string;
  eventId: string;
  userId: string;
  status: AvailabilityStatus;
  comment: string | null;
  remindersLeft: number; // Spec: "reminders (max 2)"
  createdAt: string;
  updatedAt: string;
}

// Spec section 10: Lineup
export interface MatchLineup {
  id: string;
  eventId: string;
  teamId: string;
  userId: string;
  position: number;
  createdAt: string;
}
