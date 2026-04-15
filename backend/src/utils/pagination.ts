const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export function parsePagination(
  rawPage?: number,
  rawLimit?: number,
): { page: number; limit: number } {
  const page = Number.isFinite(rawPage) ? Math.max(1, rawPage as number) : DEFAULT_PAGE;
  const limit = Number.isFinite(rawLimit)
    ? Math.min(MAX_LIMIT, Math.max(1, rawLimit as number))
    : DEFAULT_LIMIT;

  return { page, limit };
}

export function safeTotalPages(total: number, limit: number): number {
  const safeLimit = Math.max(1, limit);
  return Math.ceil(total / safeLimit);
}
