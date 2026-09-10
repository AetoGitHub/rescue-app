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
import { boundsContain, type MapBounds } from '~/utils/map-viewport';

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
  const trustedOnly = ref(false);
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
      trustedOnly: trustedOnly.value,
      serviceType: options.serviceTypeFilter.value,
      orderBy: sort.value,
    });
  }

  /**
   * Bounds already covered by a previous successful fetch, for the same
   * filters. Zooming in (or panning back within it) shrinks `fetchBounds`
   * to a subset we already have in `cacheStore` — skip re-fetching it.
   */
  const fetchedCoverage = ref<{ bounds: MapBounds; fingerprint: string } | null>(null);

  const fetchFingerprint = computed(() =>
    JSON.stringify([
      sort.value,
      debouncedSearch.value,
      trustedOnly.value,
      options.serviceTypeFilter.value,
      unitCoords.value.lat,
      unitCoords.value.lng,
    ]),
  );

  const isBoundsCovered = computed(() => {
    const coverage = fetchedCoverage.value;
    if (!coverage || coverage.fingerprint !== fetchFingerprint.value) return false;
    return boundsContain(coverage.bounds, fetchBounds.value);
  });

  const { asyncStatus, error, refresh } = useQuery({
    key: () => [
      'rescue-suppliers-map',
      cacheStore.sessionHash,
      sort.value,
      debouncedSearch.value,
      trustedOnly.value,
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
      fetchedCoverage.value = {
        bounds: fetchBounds.value,
        fingerprint: fetchFingerprint.value,
      };
      return response;
    },
    enabled: () => canFetch.value && !isBoundsCovered.value,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });

  const suppliers = computed(() => {
    const inView = filterSuppliersForMapView(
      cacheStore.allSuppliers,
      displayBounds.value,
      {
        name: debouncedSearch.value,
        trustedOnly: trustedOnly.value,
        serviceType: options.serviceTypeFilter.value,
      },
    );
    return filterAndSortRescueSuppliers(inView, {
      name: '',
      sort: sort.value,
      unitLat: unitCoords.value.lat ?? null,
      unitLng: unitCoords.value.lng ?? null,
      serviceType: 'all',
      trustedOnly: trustedOnly.value,
    });
  });

  const loading = computed(() => asyncStatus.value === 'loading');

  const errorMessage = computed(() =>
    error.value != null ? getFetchErrorMessage(error.value) : '',
  );

  return {
    search,
    sort,
    trustedOnly,
    suppliers,
    loading,
    errorMessage,
    refresh,
    distanceSortBlocked,
  };
}
