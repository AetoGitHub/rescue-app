import { useInfiniteQuery } from '@pinia/colada';
import type { MaybeRefOrGetter } from 'vue';
import { RESCUE_ADMINISTRATIVE_CARDS_PATH } from '~/constants/rescue-administrative-flow';
import type { AdministrativeBoardFilters } from '~/interfaces/administrative/board-filters';
import type { AdministrativeRescueCard } from '~/interfaces/rescue/administrative';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';
import { mapAdministrativeCardFromApi } from '~/utils/rescue-administrative-api-map';

export function useAdministrativeRescueList(
  filters: MaybeRefOrGetter<AdministrativeBoardFilters>,
  options?: { enabled?: MaybeRefOrGetter<boolean> },
) {
  const apiFetch = useApiFetch();
  const filtersValue = computed(() => toValue(filters));
  const enabled = computed(() => toValue(options?.enabled) ?? true);
  const baseQuery = computed(() =>
    buildAdministrativeCardsQuery(null, filtersValue.value),
  );

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
    key: () => [
      'administrative-rescue-list',
      ...administrativeCardsApiFiltersKey(filtersValue.value, null),
    ],
    enabled: () => enabled.value,
    initialPageParam: null,
    query: ({ pageParam }) =>
      apiFetch<PaginatedResponse<Record<string, unknown>>>(
        RESCUE_ADMINISTRATIVE_CARDS_PATH,
        {
          query: buildPaginatedQuery(baseQuery.value, pageParam),
        },
      ),
    getNextPageParam: getNextCursorPageParam,
  });

  const rows = computed((): AdministrativeRescueCard[] =>
    flattenPaginatedPages<Record<string, unknown>>(data.value?.pages).map(
      mapAdministrativeCardFromApi,
    ),
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
