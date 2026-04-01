import { useMemo } from 'react';
import { useTeams } from './useTeams';
import { useAuthStore } from '../../../stores/authStore';

interface TeamMember {
  userId: string;
  user: { id: string };
}

interface TeamWithMembers {
  id: string;
  members?: TeamMember[];
}

export function useMyTeams() {
  const userId = useAuthStore((s) => s.user?.id);
  const query = useTeams();

  const { myTeams, otherTeams } = useMemo(() => {
    const teams = (query.data ?? []) as TeamWithMembers[];
    if (!userId) return { myTeams: teams, otherTeams: [] };

    const mine: TeamWithMembers[] = [];
    const rest: TeamWithMembers[] = [];
    for (const team of teams) {
      const isMember = team.members?.some(m => m.userId === userId || m.user?.id === userId);
      if (isMember) {
        mine.push(team);
      } else {
        rest.push(team);
      }
    }
    return { myTeams: mine, otherTeams: rest };
  }, [query.data, userId]);

  return { ...query, myTeams, otherTeams };
}
