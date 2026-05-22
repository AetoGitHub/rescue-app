import { useQuery } from '@pinia/colada';
import { refDebounced } from '@vueuse/core';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';
import type { RescueSupplierSort } from '~/interfaces/rescue';
import { SUPPLIER_LIST_PATH } from '~/constants/rescue-api';
import { parseRescueCoord } from '~/schemas/rescue-create';
import { mapSupplierListItem, mapSupplierListRow } from '~/utils/supplier-list';

export function useRescueSupplierSearch(options: {
  latitude: Ref<string | null>;
  longitude: Ref<string | null>;
}) {
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

  function buildQuery(): Record<string, string> {
    const query: Record<string, string> = {
      order_by: sort.value,
    };

    const name = debouncedSearch.value.trim();
    if (name) {
      query.name = name;
    }

    if (
      sort.value === 'distance'
      && unitCoords.value.lat != null
      && unitCoords.value.lng != null
    ) {
      query.lat = String(unitCoords.value.lat);
      query.lng = String(unitCoords.value.lng);
    }

    return query;
  }

  const { data, asyncStatus, error, refresh } = useQuery({
    key: () => [
      'rescue-suppliers-list',
      sort.value,
      debouncedSearch.value,
      unitCoords.value.lat ?? '',
      unitCoords.value.lng ?? '',
    ],
    query: async ({ signal }) =>
      $fetch<PaginatedResponse<Record<string, unknown>>>(SUPPLIER_LIST_PATH, {
        query: buildQuery(),
        signal,
      }),
    enabled: () => canFetch.value,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });

  const suppliers = computed(() => {
    const rows = data.value?.results ?? [];
    return groupTrustedFirst(
      rows.map((raw) => mapSupplierListItem(mapSupplierListRow(raw))),
    );
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
