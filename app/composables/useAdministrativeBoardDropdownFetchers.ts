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

  const fetchAdministrativeClientDropdown: CatalogDropdownFetcher = async (
    name,
    options,
  ) => {
    try {
      return await apiFetch<PaginatedResponse<CatalogDropdownRow>>(
        '/api/catalogue/client/dropdown/',
        { query: { name }, signal: options?.signal },
      );
    } catch {
      const res = await apiFetch<PaginatedResponse<{ id: number; name: string }>>(
        '/api/catalogue/client/list/',
        { query: { name }, signal: options?.signal },
      );
      return {
        next: res.next,
        previous: res.previous,
        results: (res.results ?? []).map((row) => ({
          id: row.id,
          name: row.name,
        })),
      };
    }
  };

  return {
    fetchAdministrativeManagerDropdown,
    fetchAdministrativeSellerDropdown,
    fetchAdministrativeCompanyDropdown,
    fetchAdministrativeClientDropdown,
  };
}
