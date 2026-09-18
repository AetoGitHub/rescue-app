import { useInfiniteQuery } from '@pinia/colada';
import type { MaybeRefOrGetter } from 'vue';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';
import type {
  TmsRescue,
  TmsRescueListResponse,
} from '~/interfaces/portals/tms';
import {
  TMS_RESCUE_COMPLETED_LIST_PATH,
  TMS_RESCUE_COMPLETED_LIST_QUERY_KEY,
} from '~/constants/tms-portal-api';

/** Rescates ya subidos (correct_upload y/o manual_upload), filtrables por folio. */
export function useTmsCompletedRescueList(
  folio: MaybeRefOrGetter<string>,
) {
  const apiFetch = useApiFetch();
  const baseQuery = computed(() => buildTmsCompletedRescueQuery(toValue(folio)));

  const {
    data,
    asyncStatus,
    hasNextPage,
    loadNextPage,
    isPending,
    error,
    refresh,
  } = useInfiniteQuery<PaginatedResponse<TmsRescue>, Error, string | null>({
    key: () => [
      ...TMS_RESCUE_COMPLETED_LIST_QUERY_KEY,
      toValue(folio).trim(),
    ],
    initialPageParam: null,
    query: async ({ pageParam }) => {
      const response = await apiFetch<TmsRescueListResponse>(
        TMS_RESCUE_COMPLETED_LIST_PATH,
        {
          query: buildPageNumberQuery(baseQuery.value, pageParam),
        },
      );
      return normalizeTmsRescuePage(response);
    },
    getNextPageParam: getNextPageNumberPageParam,
    refetchOnWindowFocus: false,
  });

  const rows = computed(() =>
    flattenPaginatedPages<TmsRescue>(data.value?.pages),
  );
  const isInitialLoading = computed(
    () =>
      (asyncStatus.value === 'loading' || isPending.value)
      && rows.value.length === 0,
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
