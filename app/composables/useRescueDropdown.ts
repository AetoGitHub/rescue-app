import { useInfiniteQuery } from '@pinia/colada';
import { refDebounced } from '@vueuse/core';
import type { MaybeRefOrGetter } from 'vue';
import { RESCUE_DROPDOWN_PATH } from '~/constants/rescue-admin-doc-api';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';
import {
  mapRescueDropdownRow,
  mapRescueDropdownSelectItem,
} from '~/utils/rescue-dropdown-map';

export type RescueDropdownQuery = {
  folio?: string;
  client?: number | null;
  admin_status?: string | null;
  operative_status?: string | null;
};

export function useRescueDropdown(options?: {
  baseQuery?: MaybeRefOrGetter<RescueDropdownQuery>;
  excludeRescueId?: MaybeRefOrGetter<number | null>;
}) {
  const apiFetch = useApiFetch();
  const search = ref('');
  const debouncedSearch = refDebounced(search, 300);

  const baseQueryValue = computed(() => toValue(options?.baseQuery) ?? {});
  const excludeId = computed(() => toValue(options?.excludeRescueId) ?? null);

  const queryParams = computed((): Record<string, string> => {
    const params: Record<string, string> = {};
    const base = baseQueryValue.value;

    const folio = debouncedSearch.value.trim() || base.folio?.trim();
    if (folio) params.folio = folio;

    if (base.client != null) {
      params.client = String(base.client);
    }
    if (base.admin_status?.trim()) {
      params.admin_status = base.admin_status.trim();
    }
    if (base.operative_status?.trim()) {
      params.operative_status = base.operative_status.trim();
    }

    return params;
  });

  const {
    data,
    asyncStatus,
    hasNextPage,
    loadNextPage,
    error,
    refresh,
  } = useInfiniteQuery<
    PaginatedResponse<Record<string, unknown>>,
    Error,
    string | null
  >({
    key: () => ['rescue-dropdown', JSON.stringify(queryParams.value)],
    initialPageParam: null,
    query: ({ pageParam }) =>
      apiFetch<PaginatedResponse<Record<string, unknown>>>(
        RESCUE_DROPDOWN_PATH,
        {
          query: buildPaginatedQuery(queryParams.value, pageParam),
        },
      ),
    getNextPageParam: getNextCursorPageParam,
  });

  const items = computed(() =>
    flattenPaginatedPages<Record<string, unknown>>(data.value?.pages)
      .map(mapRescueDropdownRow)
      .filter((row) => row.id !== excludeId.value)
      .map(mapRescueDropdownSelectItem),
  );

  const loading = computed(() => asyncStatus.value === 'loading');
  const errorMessage = computed(() =>
    error.value != null ? getFetchErrorMessage(error.value) : '',
  );

  return {
    search,
    items,
    loading,
    errorMessage,
    hasNextPage,
    loadNextPage,
    refresh,
  };
}
