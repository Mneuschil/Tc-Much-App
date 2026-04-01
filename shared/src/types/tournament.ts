export enum TournamentType {
  KNOCKOUT = 'KNOCKOUT',
  LADDER = 'LADDER',
  ROUND_ROBIN = 'ROUND_ROBIN',
}

export enum TournamentCategory {
  SINGLES = 'SINGLES',
  DOUBLES = 'DOUBLES',
  MIXED = 'MIXED',
}

export enum TournamentStatus {
  REGISTRATION_OPEN = 'REGISTRATION_OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export enum TournamentMatchStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  WALKOVER = 'WALKOVER',
}

export enum ChallengeStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  COMPLETED = 'COMPLETED',
}

export interface Tournament {
  id: string;
  name: string;
  type: TournamentType;
  category: TournamentCategory;
  status: TournamentStatus;
  description: string | null;
  startDate: string;
  endDate: string | null;
  maxParticipants: number | null;
  clubId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface TournamentRegistration {
  id: string;
  tournamentId: string;
  userId: string;
  partnerId: string | null;
  seed: number | null;
  createdAt: string;
}

export interface TournamentMatch {
  id: string;
  tournamentId: string;
  round: number;
  position: number;
  player1Id: string | null;
  player2Id: string | null;
  winnerId: string | null;
  score: string | null;
  status: TournamentMatchStatus;
  scheduledDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LadderRanking {
  id: string;
  clubId: string;
  userId: string;
  rank: number;
  points: number;
  wins: number;
  losses: number;
  createdAt: string;
  updatedAt: string;
}

export interface LadderChallenge {
  id: string;
  clubId: string;
  challengerId: string;
  challengedId: string;
  status: ChallengeStatus;
  score: string | null;
  winnerId: string | null;
  deadline: string | null;
  createdAt: string;
  updatedAt: string;
}

