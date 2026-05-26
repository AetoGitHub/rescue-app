import { useInfiniteQuery } from '@pinia/colada';
import type { MaybeRefOrGetter } from 'vue';
import type { OperationalRescueStatus } from '~/constants/operational-kanban';
import type { OperationalBoardFilters } from '~/interfaces/operational/board-filters';
import type { RescueCard } from '~/interfaces/rescue';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';

const RESCUE_CARDS_PATH = '/api/rescue/cards/';

export function useOperationalRescueCards(
  status: MaybeRefOrGetter<OperationalRescueStatus>,
  filters: MaybeRefOrGetter<OperationalBoardFilters>,
) {
  const apiFetch = useApiFetch();
  const statusValue = computed(() => toValue(status));
  const filtersValue = computed(() => toValue(filters));

  const {
    data,
    asyncStatus,
    hasNextPage,
    loadNextPage,
    isPending,
    error,
    refresh,
  } = useInfiniteQuery<PaginatedResponse<RescueCard>, Error, string | null>({
    key: () => [
      'operational-rescue-cards',
      statusValue.value,
      ...operationalBoardFiltersKey(filtersValue.value),
    ],
    initialPageParam: null,
    query: ({ pageParam }) =>
      pageParam
        ? apiFetch<PaginatedResponse<RescueCard>>(pageParam)
        : apiFetch<PaginatedResponse<RescueCard>>(RESCUE_CARDS_PATH, {
            query: buildOperationalCardsQuery(
              statusValue.value,
              filtersValue.value,
            ),
          }),
    getNextPageParam: getNextPaginatedPageParam,
  });

  const rows = computed(() =>
    flattenPaginatedPages<RescueCard>(data.value?.pages),
  );
  const isInitialLoading = computed(
    () => asyncStatus.value === 'loading' && rows.value.length === 0 && !error.value,
  );
  const isLoadingMore = computed(
    () => asyncStatus.value === 'loading' && rows.value.length > 0,
  );
  const isError = computed(() => error.value != null);
  const isInitialError = computed(
    () => isError.value && rows.value.length === 0,
  );
  const isLoadMoreError = computed(
    () => isError.value && rows.value.length > 0,
  );
  const errorMessage = computed(() =>
    error.value != null ? getFetchErrorMessage(error.value) : '',
  );

  return {
    data,
    rows,
    asyncStatus,
    hasNextPage,
    loadNextPage,
    isPending,
    isInitialLoading,
    isLoadingMore,
    error,
    isError,
    isInitialError,
    isLoadMoreError,
    errorMessage,
    refresh,
  };
}
