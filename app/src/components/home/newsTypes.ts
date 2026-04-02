export interface NewsComment {
  id: string;
  author: { firstName: string; lastName: string };
  content: string;
  createdAt: string;
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  author: { firstName: string; lastName: string };
  createdAt: string;
  likes: number;
  comments: NewsComment[];
  isLiked: boolean;
}
