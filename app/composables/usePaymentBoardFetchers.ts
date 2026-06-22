import type { CatalogDropdownFetcher } from '~/composables/useCatalogDropdown';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';

export function usePaymentBoardFetchers() {
  const apiFetch = useApiFetch();

  const fetchOperativeDropdown: CatalogDropdownFetcher = (name, options) =>
    apiFetch<PaginatedResponse<Record<string, unknown>>>(
      '/api/auth/user/dropdown/',
      { query: { role: 'operator', name }, signal: options?.signal },
    ).then((res) => ({
      next: res.next,
      previous: res.previous,
      results: (res.results ?? []).map(mapUserDropdownRow),
    }));

  const fetchSellerDropdown: CatalogDropdownFetcher = (name, options) =>
    apiFetch<PaginatedResponse<Record<string, unknown>>>(
      '/api/auth/user/dropdown/',
      { query: { role: 'seller', name }, signal: options?.signal },
    ).then((res) => ({
      next: res.next,
      previous: res.previous,
      results: (res.results ?? []).map(mapUserDropdownRow),
    }));

  return {
    fetchOperativeDropdown,
    fetchSellerDropdown,
  };
}
