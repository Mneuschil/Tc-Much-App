import { useQuery } from '@tanstack/react-query';
import { newsService } from '../services/newsService';

export function useNews(limit = 5) {
  return useQuery({
    queryKey: ['news', limit],
    queryFn: () => newsService.list(limit),
  });
}

export function useNewsDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['news', 'detail', id],
    queryFn: () => newsService.detail(id as string),
    enabled: Boolean(id),
  });
}
