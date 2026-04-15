import { SyncedContentStatus } from '@prisma/client';
import { prisma } from '../config/database';

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

function toListItem(row: {
  id: string;
  externalId: number;
  slug: string;
  title: string;
  date: string;
  tag: string;
  author: string | null;
  description: string | null;
  imageUrl: string | null;
  publishedAt: Date | null;
}): NewsListItem {
  return {
    id: row.id,
    externalId: row.externalId,
    slug: row.slug,
    title: row.title,
    date: row.date,
    tag: row.tag,
    author: row.author,
    description: row.description,
    imageUrl: row.imageUrl,
    publishedAt: row.publishedAt?.toISOString() ?? null,
  };
}

export async function listNewsForClub(clubId: string, limit: number): Promise<NewsListItem[]> {
  const rows = await prisma.syncedArticle.findMany({
    where: { clubId, status: SyncedContentStatus.PUBLISHED },
    orderBy: [{ publishedAt: 'desc' }, { externalCreatedAt: 'desc' }],
    take: limit,
    select: {
      id: true,
      externalId: true,
      slug: true,
      title: true,
      date: true,
      tag: true,
      author: true,
      description: true,
      imageUrl: true,
      publishedAt: true,
    },
  });
  return rows.map(toListItem);
}

export async function getNewsById(clubId: string, id: string): Promise<NewsDetail | null> {
  const row = await prisma.syncedArticle.findFirst({
    where: { id, clubId, status: SyncedContentStatus.PUBLISHED },
  });
  if (!row) return null;
  return {
    ...toListItem(row),
    role: row.role,
    body: row.body,
  };
}
