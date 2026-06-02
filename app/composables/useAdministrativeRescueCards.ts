import { useInfiniteQuery } from '@pinia/colada';
import type { MaybeRefOrGetter } from 'vue';
import type { AdministrativeBillingStatus } from '~/constants/administrative-kanban';
import { RESCUE_ADMINISTRATIVE_CARDS_PATH } from '~/constants/rescue-administrative-flow';
import type { AdministrativeBoardFilters } from '~/interfaces/administrative/board-filters';
import type { AdministrativeRescueCard } from '~/interfaces/rescue/administrative';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';
import { mapAdministrativeCardFromApi } from '~/utils/rescue-administrative-api-map';

export function useAdministrativeRescueCards(
  billingStatus: MaybeRefOrGetter<AdministrativeBillingStatus>,
  filters: MaybeRefOrGetter<AdministrativeBoardFilters>,
) {
  const apiFetch = useApiFetch();
  const statusValue = computed(() => toValue(billingStatus));
  const filtersValue = computed(() => toValue(filters));
  const baseQuery = computed(() =>
    buildAdministrativeCardsQuery(statusValue.value, filtersValue.value),
  );

  const {
    data,
    asyncStatus,
    hasNextPage,
    loadNextPage,
    isPending,
    error,
    refresh,
  } = useInfiniteQuery<
    PaginatedResponse<Record<string, unknown>>,
    Error,
    string | null
  >({
    key: () => [
      'administrative-rescue-cards',
      statusValue.value,
      ...administrativeCardsApiFiltersKey(filtersValue.value, statusValue.value),
    ],
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
