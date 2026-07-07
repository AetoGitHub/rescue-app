import { useInfiniteQuery } from '@pinia/colada';
import type { MaybeRefOrGetter } from 'vue';
import { PENDING_INVOICE_API_PATHS } from '~/constants/pending-invoice-api';
import type { PendingInvoiceDetailRow } from '~/interfaces/invoicing/pending-invoice';
import type { PendingInvoiceDetailFilters } from '~/interfaces/invoicing/pending-invoice-filters';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';
import {
  buildPendingInvoiceDetailQuery,
  pendingInvoiceDetailFiltersKey,
} from '~/utils/pending-invoice-filters';

export function usePendingInvoiceDetail(
  filters: MaybeRefOrGetter<PendingInvoiceDetailFilters>,
) {
  const apiFetch = useApiFetch();
  const filtersValue = computed(() => toValue(filters));
  const baseQuery = computed(() =>
    buildPendingInvoiceDetailQuery(filtersValue.value),
  );

  const {
    data,
    asyncStatus,
    hasNextPage,
    loadNextPage,
    error,
    refresh,
  } = useInfiniteQuery<
    PaginatedResponse<PendingInvoiceDetailRow>,
    Error,
    string | null
  >({
    key: () => [
      'pending-invoice-detail',
      ...pendingInvoiceDetailFiltersKey(filtersValue.value),
    ],
    initialPageParam: null,
    query: ({ pageParam }) =>
      apiFetch<PaginatedResponse<PendingInvoiceDetailRow>>(
        PENDING_INVOICE_API_PATHS.detail,
        {
          query: buildPaginatedQuery(baseQuery.value, pageParam),
        },
      ),
    getNextPageParam: getNextCursorPageParam,
  });

  const rows = computed(() =>
    flattenPaginatedPages<PendingInvoiceDetailRow>(data.value?.pages),
  );

  const isInitialLoading = computed(
    () =>
      asyncStatus.value === 'loading'
      && rows.value.length === 0
      && error.value == null,
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
