import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';

export function toProxiedPaginationPath(nextUrl: string): string {
  try {
    const url = new URL(nextUrl, 'http://localhost');
    return `${url.pathname}${url.search}`;
  } catch {
    return nextUrl.startsWith('/') ? nextUrl : `/${nextUrl}`;
  }
}

export function getNextPaginatedPageParam(
  lastPage: PaginatedResponse<unknown>,
): string | null {
  if (!lastPage.next) return null;
  return toProxiedPaginationPath(lastPage.next);
}

export function flattenPaginatedPages<T>(
  pages: PaginatedResponse<T>[] | undefined,
): T[] {
  return pages?.flatMap((page) => page.results) ?? [];
}
