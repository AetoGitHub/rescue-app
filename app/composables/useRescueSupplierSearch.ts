import { useQuery } from '@pinia/colada';
import { refDebounced } from '@vueuse/core';
import type {
  SupplierMapListQuery,
  SupplierServiceType,
} from '~/interfaces/catalogs/supplier';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';
import type { RescueSupplierSort } from '~/interfaces/rescue';
import {
  SUPPLIER_MAP_PATH,
  SUPPLIER_RESCUE_SEARCH_RADIUS_KM,
} from '~/constants/rescue-api';
import { parseRescueCoord } from '~/schemas/rescue-create';
import type { MapBounds } from '~/utils/map-viewport';

function boundsFromQuery(viewport: SupplierMapListQuery): MapBounds {
  return {
    north: viewport.north,
    south: viewport.south,
    east: viewport.east,
    west: viewport.west,
  };
}

export function useRescueSupplierSearch(options: {
  latitude: Ref<string | null>;
  longitude: Ref<string | null>;
  serviceTypeFilter: Ref<SupplierServiceType | 'all'>;
  fetchViewport: Ref<SupplierMapListQuery | null>;
  displayViewport: Ref<SupplierMapListQuery | null>;
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

  const fallbackBounds = computed((): MapBounds => {
    const { lat, lng } = unitCoords.value;
    if (lat != null && lng != null) {
      return boundsFromCenter(lat, lng, SUPPLIER_RESCUE_SEARCH_RADIUS_KM);
    }
    return DEFAULT_SUPPLIER_SEARCH_BOUNDS;
  });

  const fetchBounds = computed((): MapBounds => {
    const viewport = options.fetchViewport.value;
    return viewport ? boundsFromQuery(viewport) : fallbackBounds.value;
  });

  const fetchZoom = computed(() => options.fetchViewport.value?.zoom);

  const displayBounds = computed((): MapBounds => {
    const viewport = options.displayViewport.value;
    return viewport ? boundsFromQuery(viewport) : fallbackBounds.value;
  });

  function buildQuery(): Record<string, string> {
    return buildSupplierMapQuery({
      hash: cacheStore.sessionHash,
      bounds: fetchBounds.value,
      zoom: fetchZoom.value,
      name: debouncedSearch.value,
      trustedOnly: true,
      serviceType: options.serviceTypeFilter.value,
      orderBy: sort.value,
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
      fetchBounds.value.north,
      fetchBounds.value.south,
      fetchBounds.value.east,
      fetchBounds.value.west,
      fetchZoom.value ?? '',
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

  const suppliers = computed(() => {
    const inView = filterSuppliersForMapView(
      cacheStore.allSuppliers,
      displayBounds.value,
      {
        name: debouncedSearch.value,
        trustedOnly: true,
        serviceType: options.serviceTypeFilter.value,
      },
    );
    return filterAndSortRescueSuppliers(inView, {
      name: '',
      sort: sort.value,
      unitLat: unitCoords.value.lat ?? null,
      unitLng: unitCoords.value.lng ?? null,
      serviceType: 'all',
      trustedOnly: false,
    });
  });

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
