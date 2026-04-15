// ─── Calendar System (spec section 7) ───────────────────────────────

// Spec: 7 event types
export enum EventType {
  LEAGUE_MATCH = 'LEAGUE_MATCH',
  CUP_MATCH = 'CUP_MATCH',
  CLUB_CHAMPIONSHIP = 'CLUB_CHAMPIONSHIP',
  RANKING_MATCH = 'RANKING_MATCH',
  TRAINING = 'TRAINING',
  CLUB_EVENT = 'CLUB_EVENT',
  TOURNAMENT = 'TOURNAMENT',
}

export enum Platform {
  IOS = 'IOS',
  ANDROID = 'ANDROID',
}

export enum TrainingType {
  MANNSCHAFTSTRAINING = 'MANNSCHAFTSTRAINING',
  JUGENDTRAINING = 'JUGENDTRAINING',
  SCHNUPPERSTUNDE = 'SCHNUPPERSTUNDE',
  PRIVATGRUPPE = 'PRIVATGRUPPE',
}

// Spec section 7: Event Fields
export interface Event {
  id: string;
  title: string;
  description: string | null;
  type: EventType;
  trainingType: TrainingType | null;
  location: string | null;
  court: string | null;
  opponentName: string | null;
  isHomeGame: boolean | null;
  startDate: string;
  endDate: string | null;
  teamId: string | null;
  clubId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface PushToken {
  id: string;
  userId: string;
  token: string;
  platform: Platform;
  createdAt: string;
  updatedAt: string;
}
