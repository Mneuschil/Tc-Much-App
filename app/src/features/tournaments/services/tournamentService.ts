import api from '../../../lib/api';
import { ENDPOINTS } from '../../../lib/endpoints';
import type {
  Tournament,
  TournamentMatch,
  TournamentRegistration,
  TournamentRegistrationInput,
  ReportResultInput,
} from '@tennis-club/shared';

export const tournamentService = {
  getTournaments: () =>
    api.get<{ data: Tournament[] }>(ENDPOINTS.tournaments.list).then((r) => r.data.data),

  getTournament: (id: string) =>
    api.get<{ data: Tournament }>(ENDPOINTS.tournaments.detail(id)).then((r) => r.data.data),

  getBracket: (id: string) =>
    api
      .get<{ data: TournamentMatch[] }>(ENDPOINTS.tournaments.bracket(id))
      .then((r) => r.data.data),

  getRegistrations: (id: string) =>
    api
      .get<{ data: TournamentRegistration[] }>(ENDPOINTS.tournaments.registrations(id))
      .then((r) => r.data.data),

  register: (input: TournamentRegistrationInput) =>
    api.post(ENDPOINTS.tournaments.register(input.tournamentId), input).then((r) => r.data.data),

  reportResult: (tournamentId: string, input: ReportResultInput) =>
    api.post(ENDPOINTS.tournaments.reportResult(tournamentId), input).then((r) => r.data.data),
};
