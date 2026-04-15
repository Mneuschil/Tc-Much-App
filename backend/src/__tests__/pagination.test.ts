import { parsePagination, safeTotalPages } from '../utils/pagination';

describe('parsePagination', () => {
  it('returns defaults when no args given', () => {
    const result = parsePagination();
    expect(result).toEqual({ page: 1, limit: 50 });
  });

  it('parses valid numeric values', () => {
    const result = parsePagination(3, 25);
    expect(result).toEqual({ page: 3, limit: 25 });
  });

  it('clamps limit=0 to 1 (C-01/C-02 crash path)', () => {
    const result = parsePagination(1, 0);
    expect(result.limit).toBe(1);
  });

  it('clamps negative limit to 1', () => {
    const result = parsePagination(1, -10);
    expect(result.limit).toBe(1);
  });

  it('falls back on NaN limit', () => {
    const result = parsePagination(1, NaN);
    expect(result.limit).toBe(50);
  });

  it('falls back on undefined limit', () => {
    const result = parsePagination(1, undefined);
    expect(result.limit).toBe(50);
  });

  it('clamps page=0 to 1', () => {
    const result = parsePagination(0, 20);
    expect(result.page).toBe(1);
  });

  it('clamps negative page to 1', () => {
    const result = parsePagination(-5, 20);
    expect(result.page).toBe(1);
  });

  it('falls back on NaN page', () => {
    const result = parsePagination(NaN, 20);
    expect(result.page).toBe(1);
  });

  it('caps limit at 100', () => {
    const result = parsePagination(1, 9999);
    expect(result.limit).toBe(100);
  });

  it('handles string-like inputs from query params', () => {
    // Number("abc") = NaN, Number("") = 0
    const result = parsePagination(Number('abc'), Number(''));
    expect(result.page).toBe(1);
    expect(result.limit).toBe(1); // Number('') = 0, clamped to 1
  });
});

describe('paginated response (C-01 regression)', () => {
  it('never produces Infinity in totalPages', () => {
    // This test imports apiResponse and checks that limit=0 does not produce Infinity
    // We test the math directly since paginated() writes to a Response mock
    // safeTotalPages imported at top of file
    expect(safeTotalPages(100, 0)).not.toBe(Infinity);
    expect(safeTotalPages(100, 0)).toBeGreaterThanOrEqual(1);
  });
});
