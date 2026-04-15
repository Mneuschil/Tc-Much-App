import { SyncedContentStatus } from '@prisma/client';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

// ─── Wire types (must match /api/sync/articles + /api/sync/events) ──

interface SyncCursor {
  since: string;
  cursor: number;
}

interface SyncResponse<T> {
  data: T[];
  nextCursor: SyncCursor | null;
  syncedAt: string;
}

interface WireArticle {
  id: number;
  slug: string;
  title: string;
  date: string;
  tag: string;
  author: string | null;
  role: string | null;
  description: string | null;
  body: string;
  imageUrl: string | null;
  status: 'draft' | 'published' | 'deleted';
  createdAt: string;
  updatedAt: string;
}

interface WireEvent {
  id: number;
  title: string;
  date: string;
  time: string | null;
  category: string;
  description: string | null;
  registrationUrl: string | null;
  status: 'draft' | 'published' | 'deleted';
  createdAt: string;
  updatedAt: string;
}

export interface SyncResult {
  sourceKey: string;
  articles: { upserted: number; pages: number };
  events: { upserted: number; pages: number };
  durationMs: number;
}

// ─── Helpers ────────────────────────────────────────────────────────

function mapStatus(s: 'draft' | 'published' | 'deleted'): SyncedContentStatus {
  switch (s) {
    case 'draft':
      return SyncedContentStatus.DRAFT;
    case 'published':
      return SyncedContentStatus.PUBLISHED;
    case 'deleted':
      return SyncedContentStatus.DELETED;
  }
}

// Website returns SQLite datetime strings like "2026-04-10 10:00:00" (UTC).
// Parse as UTC so ordering matches the source.
function parseWireDate(raw: string): Date {
  const iso = raw.includes('T') ? raw : raw.replace(' ', 'T') + 'Z';
  return new Date(iso);
}

async function fetchPage<T>(
  baseUrl: string,
  token: string,
  path: string,
  params: URLSearchParams,
): Promise<SyncResponse<T>> {
  const url = `${baseUrl.replace(/\/$/, '')}${path}?${params.toString()}`;
  const res = await fetch(url, {
    headers: { 'X-Sync-Token': token, Accept: 'application/json' },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Sync fetch ${res.status} from ${url}: ${text.slice(0, 200)}`);
  }
  return (await res.json()) as SyncResponse<T>;
}

// ─── Upsert helpers ────────────────────────────────────────────────

async function upsertArticle(sourceId: string, clubId: string, a: WireArticle): Promise<void> {
  const externalCreatedAt = parseWireDate(a.createdAt);
  const externalUpdatedAt = parseWireDate(a.updatedAt);
  const publishedAt = a.status === 'published' ? externalCreatedAt : null;

  await prisma.syncedArticle.upsert({
    where: { sourceId_externalId: { sourceId, externalId: a.id } },
    create: {
      sourceId,
      externalId: a.id,
      clubId,
      slug: a.slug,
      title: a.title,
      date: a.date,
      tag: a.tag,
      author: a.author,
      role: a.role,
      description: a.description,
      body: a.body,
      imageUrl: a.imageUrl,
      status: mapStatus(a.status),
      publishedAt,
      externalCreatedAt,
      externalUpdatedAt,
      lastSyncedAt: new Date(),
    },
    update: {
      slug: a.slug,
      title: a.title,
      date: a.date,
      tag: a.tag,
      author: a.author,
      role: a.role,
      description: a.description,
      body: a.body,
      imageUrl: a.imageUrl,
      status: mapStatus(a.status),
      publishedAt,
      externalUpdatedAt,
      lastSyncedAt: new Date(),
    },
  });
}

async function upsertEvent(sourceId: string, clubId: string, e: WireEvent): Promise<void> {
  const externalCreatedAt = parseWireDate(e.createdAt);
  const externalUpdatedAt = parseWireDate(e.updatedAt);

  await prisma.syncedClubEvent.upsert({
    where: { sourceId_externalId: { sourceId, externalId: e.id } },
    create: {
      sourceId,
      externalId: e.id,
      clubId,
      title: e.title,
      date: e.date,
      time: e.time,
      category: e.category,
      description: e.description,
      registrationUrl: e.registrationUrl,
      status: mapStatus(e.status),
      externalCreatedAt,
      externalUpdatedAt,
      lastSyncedAt: new Date(),
    },
    update: {
      title: e.title,
      date: e.date,
      time: e.time,
      category: e.category,
      description: e.description,
      registrationUrl: e.registrationUrl,
      status: mapStatus(e.status),
      externalUpdatedAt,
      lastSyncedAt: new Date(),
    },
  });
}

// ─── Paginated sync loop ───────────────────────────────────────────

async function syncEndpoint<T extends { id: number; updatedAt: string }>(
  baseUrl: string,
  token: string,
  path: string,
  startCursor: SyncCursor | null,
  upsert: (wire: T) => Promise<void>,
): Promise<{ upserted: number; pages: number; lastCursor: SyncCursor | null }> {
  let cursor = startCursor;
  let upserted = 0;
  let pages = 0;
  const maxPages = 100;

  while (pages < maxPages) {
    const params = new URLSearchParams({ limit: '200' });
    if (cursor) {
      params.set('since', cursor.since);
      params.set('cursor', String(cursor.cursor));
    }
    const page = await fetchPage<T>(baseUrl, token, path, params);
    pages += 1;
    for (const item of page.data) {
      await upsert(item);
      upserted += 1;
    }
    // Advance cursor to the last item of the page so we resume there next run,
    // even if nextCursor is null (= reached tail).
    if (page.data.length > 0) {
      const last = page.data[page.data.length - 1]!;
      cursor = { since: last.updatedAt, cursor: last.id };
    }
    if (!page.nextCursor) break;
    cursor = page.nextCursor;
  }

  return { upserted, pages, lastCursor: cursor };
}

// ─── Public API ────────────────────────────────────────────────────

export async function syncSource(sourceKey: string): Promise<SyncResult> {
  const started = Date.now();
  const source = await prisma.syncSource.findUnique({ where: { key: sourceKey } });
  if (!source) throw new Error(`Unknown sync source: ${sourceKey}`);
  if (!source.enabled) throw new Error(`Sync source disabled: ${sourceKey}`);

  const startCursor: SyncCursor | null =
    source.cursorSince !== null && source.cursorId !== null
      ? { since: source.cursorSince, cursor: source.cursorId }
      : null;

  try {
    const articles = await syncEndpoint<WireArticle>(
      source.baseUrl,
      source.syncToken,
      '/api/sync/articles',
      startCursor,
      (a) => upsertArticle(source.id, source.clubId, a),
    );

    // Events volume is tiny (< 50 rows total) so we do a full refresh every
    // run instead of tracking a separate cursor. Upsert is idempotent.
    const events = await syncEndpoint<WireEvent>(
      source.baseUrl,
      source.syncToken,
      '/api/sync/events',
      null,
      (e) => upsertEvent(source.id, source.clubId, e),
    );

    const finalCursor = articles.lastCursor ?? startCursor;
    await prisma.syncSource.update({
      where: { id: source.id },
      data: {
        cursorSince: finalCursor?.since ?? null,
        cursorId: finalCursor?.cursor ?? null,
        lastSyncedAt: new Date(),
        lastError: null,
      },
    });

    const durationMs = Date.now() - started;
    logger.info('Website sync ok', {
      sourceKey,
      articlesUpserted: articles.upserted,
      articlesPages: articles.pages,
      eventsUpserted: events.upserted,
      eventsPages: events.pages,
      durationMs,
    });

    return {
      sourceKey,
      articles: { upserted: articles.upserted, pages: articles.pages },
      events: { upserted: events.upserted, pages: events.pages },
      durationMs,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await prisma.syncSource.update({
      where: { id: source.id },
      data: { lastError: message.slice(0, 500) },
    });
    logger.error('Website sync failed', { sourceKey, error: message });
    throw e;
  }
}

export async function syncAllEnabled(): Promise<SyncResult[]> {
  const sources = await prisma.syncSource.findMany({ where: { enabled: true } });
  const results: SyncResult[] = [];
  for (const s of sources) {
    try {
      results.push(await syncSource(s.key));
    } catch {
      // error already logged + persisted; continue with other sources
    }
  }
  return results;
}
