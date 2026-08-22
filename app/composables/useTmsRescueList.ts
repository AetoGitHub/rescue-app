import { useInfiniteQuery } from '@pinia/colada';
import type { MaybeRefOrGetter } from 'vue';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';
import type {
  TmsRescue,
  TmsRescueFilters,
  TmsRescueListResponse,
} from '~/interfaces/portals/tms';
import {
  TMS_RESCUE_LIST_PATH,
  TMS_RESCUE_LIST_QUERY_KEY,
} from '~/constants/tms-portal-api';

export function useTmsRescueList(
  filters?: MaybeRefOrGetter<TmsRescueFilters>,
) {
  const apiFetch = useApiFetch();
  const baseQuery = computed(() => buildTmsRescueQuery(toValue(filters)));

  const {
    data,
    asyncStatus,
    hasNextPage,
    loadNextPage,
    error,
    refresh,
  } = useInfiniteQuery<PaginatedResponse<TmsRescue>, Error, string | null>({
    key: () => [
      ...TMS_RESCUE_LIST_QUERY_KEY,
      ...serializeTmsRescueFilters(toValue(filters)),
    ],
    initialPageParam: null,
    query: async ({ pageParam }) => {
      const response = await apiFetch<TmsRescueListResponse>(
        TMS_RESCUE_LIST_PATH,
        {
          query: buildPaginatedQuery(baseQuery.value, pageParam),
        },
      );
      return normalizeTmsRescuePage(response);
    },
    getNextPageParam: getNextCursorPageParam,
    refetchOnWindowFocus: false,
  });

  const rows = computed(() =>
    flattenPaginatedPages<TmsRescue>(data.value?.pages),
  );
  const isInitialLoading = computed(
    () => asyncStatus.value === 'loading' && rows.value.length === 0,
  );
  const errorMessage = computed(() =>
    error.value ? getFetchErrorMessage(error.value) : '',
  );

  return {
    rows,
    asyncStatus,
    hasNextPage,
    loadNextPage,
    isInitialLoading,
    isError: computed(() => error.value != null),
    errorMessage,
    refresh,
  };
}
