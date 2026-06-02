import type { CatalogDropdownFetcher } from '~/composables/useCatalogDropdown';
import type { CatalogDropdownRow } from '~/interfaces/shared/catalog-dropdown.interface';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';

export function useAdministrativeBoardDropdownFetchers() {
  const apiFetch = useApiFetch();

  const fetchAdministrativeManagerDropdown: CatalogDropdownFetcher = (
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

  const fetchAdministrativeSellerDropdown: CatalogDropdownFetcher = (
    name,
    options,
  ) =>
    apiFetch<PaginatedResponse<Record<string, unknown>>>(
      '/api/auth/user/dropdown/',
      { query: { role: 'seller', name }, signal: options?.signal },
    ).then((res) => ({
      next: res.next,
      previous: res.previous,
      results: (res.results ?? []).map(mapUserDropdownRow),
    }));

  const fetchAdministrativeCompanyDropdown: CatalogDropdownFetcher = (
    name,
    options,
  ) =>
    apiFetch<PaginatedResponse<CatalogDropdownRow>>(
      '/api/catalogue/company/dropdown/',
      { query: { name }, signal: options?.signal },
    );

  return {
    fetchAdministrativeManagerDropdown,
    fetchAdministrativeSellerDropdown,
    fetchAdministrativeCompanyDropdown,
  };
}
