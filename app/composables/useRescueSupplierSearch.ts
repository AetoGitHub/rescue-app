import { useQuery } from '@pinia/colada';
import { refDebounced } from '@vueuse/core';
import type { SupplierServiceType } from '~/interfaces/catalogs/supplier';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';
import type { RescueSupplierSort } from '~/interfaces/rescue';
import {
  SUPPLIER_MAP_PATH,
  SUPPLIER_RESCUE_SEARCH_RADIUS_KM,
} from '~/constants/rescue-api';
import { parseRescueCoord } from '~/schemas/rescue-create';

export function useRescueSupplierSearch(options: {
  latitude: Ref<string | null>;
  longitude: Ref<string | null>;
  serviceTypeFilter: Ref<SupplierServiceType | 'all'>;
}) {
  const cacheStore = useSupplierLocationCacheStore();
  const apiFetch = useApiFetch();
  const search = ref('');
  const sort = ref<RescueSupplierSort>('ranking');
  const debouncedSearch = refDebounced(search, 300);

  const unitCoords = computed(() => ({
    lat: parseRescueCoord(options.latitude.value),
    lng: parseRescueCoord(options.longitude.value),
  }));

  const distanceSortBlocked = computed(
    () =>
      sort.value === 'distance'
      && (unitCoords.value.lat == null || unitCoords.value.lng == null),
  );

  const canFetch = computed(() => !distanceSortBlocked.value);

  const searchBounds = computed(() => {
    const { lat, lng } = unitCoords.value;
    if (lat != null && lng != null) {
      return boundsFromCenter(lat, lng, SUPPLIER_RESCUE_SEARCH_RADIUS_KM);
    }
    return DEFAULT_SUPPLIER_SEARCH_BOUNDS;
  });

  function buildQuery(): Record<string, string> {
    return buildSupplierMapQuery({
      hash: cacheStore.sessionHash,
      bounds: searchBounds.value,
      name: debouncedSearch.value,
      trustedOnly: true,
      serviceType: options.serviceTypeFilter.value,
      orderBy: sort.value,
      unitLat: unitCoords.value.lat,
      unitLng: unitCoords.value.lng,
    });
  }

  const { asyncStatus, error, refresh } = useQuery({
    key: () => [
      'rescue-suppliers-map',
      cacheStore.sessionHash,
      sort.value,
      debouncedSearch.value,
      options.serviceTypeFilter.value,
      unitCoords.value.lat ?? '',
      unitCoords.value.lng ?? '',
      searchBounds.value.north,
      searchBounds.value.south,
      searchBounds.value.east,
      searchBounds.value.west,
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
    enabled: () => canFetch.value,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });

  const suppliers = computed(() =>
    filterAndSortRescueSuppliers(cacheStore.allSuppliers, {
      name: debouncedSearch.value,
      sort: sort.value,
      unitLat: unitCoords.value.lat ?? null,
      unitLng: unitCoords.value.lng ?? null,
      serviceType: options.serviceTypeFilter.value,
      trustedOnly: true,
    }),
  );

  const loading = computed(() => asyncStatus.value === 'loading');

  const errorMessage = computed(() =>
    error.value != null ? getFetchErrorMessage(error.value) : '',
  );

  return {
    search,
    sort,
    suppliers,
    loading,
    errorMessage,
    refresh,
    distanceSortBlocked,
  };
}
