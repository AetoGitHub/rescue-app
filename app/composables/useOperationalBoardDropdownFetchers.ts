import type { CatalogDropdownFetcher } from '~/composables/useCatalogDropdown';
import type { CatalogDropdownRow } from '~/interfaces/shared/catalog-dropdown.interface';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';

export function useOperationalBoardDropdownFetchers() {
  const apiFetch = useApiFetch();

  const fetchOperationalCompanyDropdown: CatalogDropdownFetcher = (
    name,
    options,
  ) =>
    apiFetch<PaginatedResponse<CatalogDropdownRow>>(
      '/api/catalogue/company/dropdown/',
      { query: { name }, signal: options?.signal },
    );

  const fetchOperationalManagerDropdown: CatalogDropdownFetcher = (
    name,
    options,
  ) =>
    apiFetch<PaginatedResponse<Record<string, unknown>>>(
      '/api/auth/user/dropdown/',
      { query: { role: 'operator', name }, signal: options?.signal },
    ).then((res) => ({
      next: res.next,
      previous: res.previous,
      results: (res.results ?? []).map(mapUserDropdownRow),
    }));

  return {
    fetchOperationalCompanyDropdown,
    fetchOperationalManagerDropdown,
  };
}
