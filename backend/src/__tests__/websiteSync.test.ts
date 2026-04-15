import { prisma } from '../config/database';
import { syncSource } from '../services/websiteSync.service';

// Mock global fetch per test
const realFetch = global.fetch;
const mockFetch = jest.fn();

beforeAll(() => {
  global.fetch = mockFetch as unknown as typeof fetch;
});

afterAll(async () => {
  global.fetch = realFetch;
  await prisma.$disconnect();
});

// Small helper to create the Response-shape syncSource fetches
function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  }) as unknown as Response;
}

describe('websiteSync.service', () => {
  let clubId: string;
  let sourceKey: string;

  beforeEach(async () => {
    mockFetch.mockReset();

    const club = await prisma.club.create({
      data: {
        name: 'Sync Test Club',
        clubCode: `SYNC-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      },
    });
    clubId = club.id;
    sourceKey = `website-test-${Date.now()}`;

    await prisma.syncSource.create({
      data: {
        key: sourceKey,
        kind: 'WEBSITE',
        clubId,
        baseUrl: 'https://api.example.test',
        syncToken: 'secret',
      },
    });
  });

  afterEach(async () => {
    await prisma.syncedArticle.deleteMany({ where: { clubId } });
    await prisma.syncedClubEvent.deleteMany({ where: { clubId } });
    await prisma.syncSource.deleteMany({ where: { clubId } });
    await prisma.club.deleteMany({ where: { id: clubId } });
  });

  it('upserts articles on first run and advances cursor', async () => {
    mockFetch
      .mockResolvedValueOnce(
        jsonResponse({
          data: [
            {
              id: 1,
              slug: 'a-1',
              title: 'Alpha',
              date: '2026-04-01',
              tag: 'News',
              author: 'TC',
              role: null,
              description: 'Teaser',
              body: 'Body Alpha',
              imageUrl: 'https://img/1.jpg',
              status: 'published',
              createdAt: '2026-04-10 10:00:00',
              updatedAt: '2026-04-10 10:00:00',
            },
            {
              id: 2,
              slug: 'a-2',
              title: 'Beta',
              date: '2026-04-02',
              tag: 'News',
              author: 'TC',
              role: null,
              description: null,
              body: 'Body Beta',
              imageUrl: null,
              status: 'draft',
              createdAt: '2026-04-10 10:01:00',
              updatedAt: '2026-04-10 10:01:00',
            },
          ],
          nextCursor: null,
          syncedAt: '2026-04-15T12:00:00Z',
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ data: [], nextCursor: null, syncedAt: '' }));

    const result = await syncSource(sourceKey);

    expect(result.articles.upserted).toBe(2);
    const stored = await prisma.syncedArticle.findMany({ where: { clubId } });
    expect(stored.map((a) => a.externalId).sort()).toEqual([1, 2]);
    expect(stored.find((a) => a.externalId === 1)?.status).toBe('PUBLISHED');
    expect(stored.find((a) => a.externalId === 2)?.status).toBe('DRAFT');

    const src = await prisma.syncSource.findUnique({ where: { key: sourceKey } });
    expect(src?.cursorId).toBe(2);
    expect(src?.cursorSince).toBe('2026-04-10 10:01:00');
    expect(src?.lastError).toBeNull();
  });

  it('propagates updates and soft-deletes', async () => {
    // seed one article
    mockFetch
      .mockResolvedValueOnce(
        jsonResponse({
          data: [
            {
              id: 1,
              slug: 'a-1',
              title: 'Original',
              date: '2026-04-01',
              tag: 'News',
              author: null,
              role: null,
              description: null,
              body: 'Body',
              imageUrl: null,
              status: 'published',
              createdAt: '2026-04-10 10:00:00',
              updatedAt: '2026-04-10 10:00:00',
            },
          ],
          nextCursor: null,
          syncedAt: '',
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ data: [], nextCursor: null, syncedAt: '' }));
    await syncSource(sourceKey);

    // second run: update + delete same article
    mockFetch
      .mockResolvedValueOnce(
        jsonResponse({
          data: [
            {
              id: 1,
              slug: 'a-1--deleted-123',
              title: 'Updated Title',
              date: '2026-04-01',
              tag: 'News',
              author: null,
              role: null,
              description: null,
              body: 'Body v2',
              imageUrl: null,
              status: 'deleted',
              createdAt: '2026-04-10 10:00:00',
              updatedAt: '2026-04-10 11:00:00',
            },
          ],
          nextCursor: null,
          syncedAt: '',
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ data: [], nextCursor: null, syncedAt: '' }));
    await syncSource(sourceKey);

    const stored = await prisma.syncedArticle.findUnique({
      where: {
        sourceId_externalId: {
          sourceId: (await prisma.syncSource.findUniqueOrThrow({ where: { key: sourceKey } })).id,
          externalId: 1,
        },
      },
    });
    expect(stored?.status).toBe('DELETED');
    expect(stored?.title).toBe('Updated Title');
    expect(stored?.body).toBe('Body v2');
  });

  it('persists lastError and surfaces fetch failures', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ error: 'oops' }, 500));

    await expect(syncSource(sourceKey)).rejects.toThrow(/Sync fetch 500/);

    const src = await prisma.syncSource.findUnique({ where: { key: sourceKey } });
    expect(src?.lastError).toMatch(/Sync fetch 500/);
  });

  it('follows nextCursor across multiple pages', async () => {
    mockFetch
      .mockResolvedValueOnce(
        jsonResponse({
          data: [
            {
              id: 1,
              slug: 'a-1',
              title: 'A',
              date: '2026-04-01',
              tag: 'News',
              author: null,
              role: null,
              description: null,
              body: 'x',
              imageUrl: null,
              status: 'published',
              createdAt: '2026-04-10 10:00:00',
              updatedAt: '2026-04-10 10:00:00',
            },
          ],
          nextCursor: { since: '2026-04-10 10:00:00', cursor: 1 },
          syncedAt: '',
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          data: [
            {
              id: 2,
              slug: 'a-2',
              title: 'B',
              date: '2026-04-02',
              tag: 'News',
              author: null,
              role: null,
              description: null,
              body: 'x',
              imageUrl: null,
              status: 'published',
              createdAt: '2026-04-10 11:00:00',
              updatedAt: '2026-04-10 11:00:00',
            },
          ],
          nextCursor: null,
          syncedAt: '',
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ data: [], nextCursor: null, syncedAt: '' }));

    const result = await syncSource(sourceKey);
    expect(result.articles.pages).toBe(2);
    expect(result.articles.upserted).toBe(2);
  });
});
