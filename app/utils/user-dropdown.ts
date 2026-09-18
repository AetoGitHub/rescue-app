import type { CatalogDropdownRow } from '~/interfaces/shared/catalog-dropdown.interface';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';

/** GET /api/auth/user/dropdown/?role=<role>&name=<search> mapped to {id, name} rows. */
export function fetchUserDropdownByRole(
  role: string,
  name: string,
  options?: { signal?: AbortSignal },
): Promise<PaginatedResponse<CatalogDropdownRow>> {
  return $fetch<PaginatedResponse<Record<string, unknown>>>(
    '/api/auth/user/dropdown/',
    { query: { role, name }, signal: options?.signal },
  ).then((res) => ({
    next: res.next,
    previous: res.previous,
    results: (res.results ?? []).map(mapUserDropdownRow),
  }));
}

export function mapUserDropdownRow(
  raw: Record<string, unknown>,
): CatalogDropdownRow {
  const id = Number(raw.id);
  const first = String(raw.first_name ?? '').trim();
  const last = String(raw.last_name ?? '').trim();
  const combined = [first, last].filter(Boolean).join(' ').trim();
  const name =
    combined
    || String(raw.name ?? '').trim()
    || String(raw.username ?? '').trim()
    || 'Sin nombre';
  return { id, name };
}
