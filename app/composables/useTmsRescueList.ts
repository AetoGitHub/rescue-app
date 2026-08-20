import { useInfiniteQuery } from '@pinia/colada';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';
import type {
  TmsRescue,
  TmsRescueListResponse,
} from '~/interfaces/portals/tms';
import {
  TMS_RESCUE_LIST_PATH,
  TMS_RESCUE_LIST_QUERY_KEY,
} from '~/constants/tms-portal-api';

export function useTmsRescueList() {
  const apiFetch = useApiFetch();

  const {
    data,
    asyncStatus,
    hasNextPage,
    loadNextPage,
    error,
    refresh,
  } = useInfiniteQuery<PaginatedResponse<TmsRescue>, Error, string | null>({
    key: () => [...TMS_RESCUE_LIST_QUERY_KEY],
    initialPageParam: null,
    query: async ({ pageParam }) => {
      const response = await apiFetch<TmsRescueListResponse>(
        TMS_RESCUE_LIST_PATH,
        {
          query: buildPaginatedQuery(undefined, pageParam),
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
