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
  shortCode: string | null;
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

/** TeamMember with populated user relation — returned by GET /teams/:id */
export interface TeamMemberWithUser extends TeamMember {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    phone?: string | null;
  };
}

/** Full team detail with members and channels — returned by GET /teams/:id */
export interface TeamDetail extends Team {
  members: TeamMemberWithUser[];
  channels: Array<{ id: string; name: string }>;
  _count?: { members: number };
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
