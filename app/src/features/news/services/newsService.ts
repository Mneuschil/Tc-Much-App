import api from '../../../lib/api';
import { ENDPOINTS } from '../../../lib/endpoints';

export interface NewsListItem {
  id: string;
  externalId: number;
  slug: string;
  title: string;
  date: string;
  tag: string;
  author: string | null;
  description: string | null;
  imageUrl: string | null;
  publishedAt: string | null;
}

export interface NewsDetail extends NewsListItem {
  role: string | null;
  body: string;
}

export const newsService = {
  list: (limit = 5): Promise<NewsListItem[]> =>
    api.get(`${ENDPOINTS.news.list}?limit=${limit}`).then((r) => r.data.data),

  detail: (id: string): Promise<NewsDetail> =>
    api.get(ENDPOINTS.news.detail(id)).then((r) => r.data.data),
};
