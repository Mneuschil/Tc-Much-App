import api from '../../../lib/api';
import type {
  Tournament,
  TournamentMatch,
  TournamentRegistration,
  TournamentRegistrationInput,
  ReportResultInput,
} from '@tennis-club/shared';

export const tournamentService = {
  getTournaments: () =>
    api.get<{ data: Tournament[] }>('/tournaments').then(r => r.data.data),

  getTournament: (id: string) =>
    api.get<{ data: Tournament }>(`/tournaments/${id}`).then(r => r.data.data),

  getBracket: (id: string) =>
    api.get<{ data: TournamentMatch[] }>(`/tournaments/${id}/bracket`).then(r => r.data.data),

  getRegistrations: (id: string) =>
    api.get<{ data: TournamentRegistration[] }>(`/tournaments/${id}/registrations`).then(r => r.data.data),

  register: (input: TournamentRegistrationInput) =>
    api.post(`/tournaments/${input.tournamentId}/register`, input).then(r => r.data.data),

  reportResult: (tournamentId: string, input: ReportResultInput) =>
    api.post(`/tournaments/${tournamentId}/result`, input).then(r => r.data.data),
};
