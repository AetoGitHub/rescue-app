import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';

/**
 * `next` is always a full URL from the API, e.g.
 * `http://localhost:8010/api/rescue/cards/?status=requested&cursor=abc123`
 * We only keep the `cursor` query value for the next request.
 */
export function extractCursorFromPaginatedNext(
  next: string | null | undefined,
): string | null {
  const value = next?.trim();
  if (!value) return null;

  try {
    const url = value.includes('://')
      ? new URL(value)
      : new URL(value, 'http://localhost');
    const cursor = url.searchParams.get('cursor')?.trim();
    return cursor || null;
  } catch {
    return null;
  }
}

export function buildPaginatedQuery(
  baseQuery: Record<string, string> | undefined,
  cursor: string | null | undefined,
): Record<string, string> | undefined {
  const normalizedCursor = cursor?.trim();
  if (!normalizedCursor) return baseQuery;

  return {
    ...baseQuery,
    cursor: normalizedCursor,
  };
}

export function getNextCursorPageParam(
  lastPage: PaginatedResponse<unknown>,
): string | null {
  return extractCursorFromPaginatedNext(lastPage.next);
}

/** Alegra y APIs con offset en `next` (ej. `"30"`), no URL con cursor. */
export function getNextOffsetPageParam(
  lastPage: PaginatedResponse<unknown>,
): string | null {
  const value = lastPage.next?.trim();
  return value || null;
}

export function flattenPaginatedPages<T>(
  pages: PaginatedResponse<T>[] | undefined,
): T[] {
  return pages?.flatMap((page) => page.results) ?? [];
}
