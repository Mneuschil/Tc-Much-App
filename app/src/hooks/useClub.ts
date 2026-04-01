import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { useThemeStore } from '../stores/themeStore';
import type { ApiResponse, Club } from '@tennis-club/shared';

export function useClub() {
  const setClubTheme = useThemeStore((s) => s.setClubTheme);

  const query = useQuery({
    queryKey: ['club'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Club>>('/club');
      if (data.data) {
        setClubTheme({
          primaryColor: data.data.primaryColor,
          secondaryColor: data.data.secondaryColor,
        });
      }
      return data.data;
    },
    staleTime: 1000 * 60 * 30, // 30 min
  });

  return query;
}
