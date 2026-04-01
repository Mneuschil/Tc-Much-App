export async function triggerWebhook(
  _event: string,
  _payload: Record<string, unknown>
): Promise<void> {
  throw new Error('Not implemented');
}

export async function sendMatchReminder(
  _matchId: string
): Promise<void> {
  throw new Error('Not implemented');
}

export async function sendTournamentNotification(
  _tournamentId: string,
  _event: string
): Promise<void> {
  throw new Error('Not implemented');
}
