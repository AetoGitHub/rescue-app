import { useQuery } from '@pinia/colada';
import { refDebounced } from '@vueuse/core';
import type {
  SupplierMapListQuery,
  SupplierServiceType,
} from '~/interfaces/catalogs/supplier';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';
import { SUPPLIER_MAP_PATH } from '~/constants/rescue-api';

export function useSupplierMapList(options: {
  viewport: Ref<SupplierMapListQuery | null>;
  search: Ref<string>;
  trustedOnly: Ref<boolean>;
  serviceTypeFilter: Ref<SupplierServiceType | 'all'>;
  enabled: Ref<boolean>;
}) {
  const apiFetch = useApiFetch();
  const debouncedSearch = refDebounced(options.search, 300);

  function buildQuery(): Record<string, string> {
    const viewport = options.viewport.value;
    if (!viewport) return {};

    const query: Record<string, string> = {
      north: String(viewport.north),
      south: String(viewport.south),
      east: String(viewport.east),
      west: String(viewport.west),
    };

    if (viewport.zoom != null) {
      query.zoom = String(viewport.zoom);
    }

    const name = debouncedSearch.value.trim();
    if (name) {
      query.name = name;
    }

    if (options.trustedOnly.value) {
      query.is_trusted = 'true';
    }

    if (options.serviceTypeFilter.value !== 'all') {
      query.service_type = options.serviceTypeFilter.value;
    }

    return query;
  }

  const { data, asyncStatus, error } = useQuery({
    key: () => [
      'suppliers-map',
      options.viewport.value?.north ?? '',
      options.viewport.value?.south ?? '',
      options.viewport.value?.east ?? '',
      options.viewport.value?.west ?? '',
      options.viewport.value?.zoom ?? '',
      debouncedSearch.value,
      options.trustedOnly.value,
      options.serviceTypeFilter.value,
    ],
    query: async ({ signal }) =>
      apiFetch<PaginatedResponse<Record<string, unknown>>>(SUPPLIER_MAP_PATH, {
        query: buildQuery(),
        signal,
      }),
    enabled: () =>
      options.enabled.value && options.viewport.value != null,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });

  const suppliers = computed(() =>
    (data.value?.results ?? []).map(mapSupplierListRow),
  );

  const loading = computed(() => asyncStatus.value === 'loading');

  const errorMessage = computed(() =>
    error.value != null ? getFetchErrorMessage(error.value) : '',
  );

  return {
    suppliers,
    loading,
    errorMessage,
  };
}
