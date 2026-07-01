import { useQuery } from '@pinia/colada';
import { refDebounced } from '@vueuse/core';
import type {
  SupplierMapListQuery,
  SupplierServiceType,
} from '~/interfaces/catalogs/supplier';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';
import { SUPPLIER_MAP_PATH } from '~/constants/rescue-api';

export function useSupplierMapList(options: {
  fetchViewport: Ref<SupplierMapListQuery | null>;
  displayViewport: Ref<SupplierMapListQuery | null>;
  search: Ref<string>;
  trustedOnly: Ref<boolean>;
  serviceTypeFilter: Ref<SupplierServiceType | 'all'>;
  enabled: Ref<boolean>;
}) {
  const cacheStore = useSupplierLocationCacheStore();
  const apiFetch = useApiFetch();
  const debouncedSearch = refDebounced(options.search, 300);

  function buildQuery(): Record<string, string> {
    const viewport = options.fetchViewport.value;
    if (!viewport) return {};

    return buildSupplierMapQuery({
      hash: cacheStore.sessionHash,
      bounds: {
        north: viewport.north,
        south: viewport.south,
        east: viewport.east,
        west: viewport.west,
      },
      zoom: viewport.zoom,
      name: debouncedSearch.value,
      trustedOnly: options.trustedOnly.value,
      serviceType: options.serviceTypeFilter.value,
    });
  }

  const { asyncStatus, error } = useQuery({
    key: () => [
      'suppliers-map',
      cacheStore.sessionHash,
      options.fetchViewport.value?.north ?? '',
      options.fetchViewport.value?.south ?? '',
      options.fetchViewport.value?.east ?? '',
      options.fetchViewport.value?.west ?? '',
      options.fetchViewport.value?.zoom ?? '',
      debouncedSearch.value,
      options.trustedOnly.value,
      options.serviceTypeFilter.value,
    ],
    query: async ({ signal }) => {
      const response = await apiFetch<PaginatedResponse<Record<string, unknown>>>(
        SUPPLIER_MAP_PATH,
        {
          query: buildQuery(),
          signal,
        },
      );
      const rows = (response?.results ?? []).map(mapSupplierListRow);
      cacheStore.mergeSuppliers(rows);
      return response;
    },
    enabled: () =>
      options.enabled.value && options.fetchViewport.value != null,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });

  const suppliers = computed(() => {
    const viewport = options.displayViewport.value;
    if (!viewport) return [];

    return filterSuppliersForMapView(cacheStore.allSuppliers, viewport, {
      name: debouncedSearch.value,
      trustedOnly: options.trustedOnly.value,
      serviceType: options.serviceTypeFilter.value,
    });
  });

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
