import { useInfiniteQuery } from '@pinia/colada';
import type { MaybeRefOrGetter } from 'vue';
import { RESCUE_LIST_PATH } from '~/constants/rescue-api';
import type { OperationalBoardFilters } from '~/interfaces/operational/board-filters';
import type { RescueCard } from '~/interfaces/rescue';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';

export function useOperationalRescueList(
  filters: MaybeRefOrGetter<OperationalBoardFilters>,
  options?: { enabled?: MaybeRefOrGetter<boolean> },
) {
  const apiFetch = useApiFetch();
  const filtersValue = computed(() => toValue(filters));
  const enabled = computed(() => toValue(options?.enabled) ?? true);
  const baseQuery = computed(() =>
    buildOperationalListQuery(filtersValue.value),
  );

  const {
    data,
    asyncStatus,
    hasNextPage,
    loadNextPage,
    error,
    refresh,
  } = useInfiniteQuery<PaginatedResponse<RescueCard>, Error, string | null>({
    key: () => [
      'operational-rescue-list',
      ...operationalListApiFiltersKey(filtersValue.value),
    ],
    enabled: () => enabled.value,
    initialPageParam: null,
    query: ({ pageParam }) =>
      apiFetch<PaginatedResponse<RescueCard>>(RESCUE_LIST_PATH, {
        query: buildPaginatedQuery(baseQuery.value, pageParam),
      }),
    getNextPageParam: getNextCursorPageParam,
  });

  const rows = computed(() =>
    flattenPaginatedPages<RescueCard>(data.value?.pages),
  );

  const isInitialLoading = computed(
    () =>
      asyncStatus.value === 'loading' && rows.value.length === 0 && !error.value,
  );
  const isLoadingMore = computed(
    () => asyncStatus.value === 'loading' && rows.value.length > 0,
  );
  const isError = computed(() => error.value != null);
  const errorMessage = computed(() =>
    error.value != null ? getFetchErrorMessage(error.value) : '',
  );

  return {
    rows,
    asyncStatus,
    hasNextPage,
    loadNextPage,
    isInitialLoading,
    isLoadingMore,
    isError,
    errorMessage,
    refresh,
  };
}
