import { useInfiniteQuery } from '@pinia/colada';
import {
  PENDING_INVOICE_BY_RESPONSIBLE_PATH,
  PENDING_INVOICE_BY_RESPONSIBLE_QUERY_KEY,
} from '~/constants/pending-invoice-api';
import type { PendingInvoiceByResponsibleApiRow } from '~/interfaces/invoicing/pending-invoice';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';
import type { PaginatedQueryValue } from '~/utils/catalog-pagination';
import { mapPendingInvoiceByResponsibleRow } from '~/utils/pending-invoice-dashboard-map';

/**
 * Aggregated "Por Responsable AETO" table from `/api/dashboard/by_responsible/`.
 * Drains the cursor so footer totals cover the full filtered set.
 */
export function usePendingInvoiceByResponsible() {
  const apiFetch = useApiFetch();
  const { companyQuery } = usePendingInvoiceList();

  const baseQuery = computed(() => {
    const query: Record<string, PaginatedQueryValue> = {};
    if (companyQuery.value != null) query.company = companyQuery.value;
    return query;
  });

  const {
    data,
    asyncStatus,
    hasNextPage,
    loadNextPage,
    error,
    refresh,
  } = useInfiniteQuery<
    PaginatedResponse<PendingInvoiceByResponsibleApiRow>,
    Error,
    string | null
  >({
    key: () => [
      PENDING_INVOICE_BY_RESPONSIBLE_QUERY_KEY,
      serializeCompanyQuery(companyQuery.value),
    ],
    initialPageParam: null,
    query: ({ pageParam }) =>
      apiFetch<PaginatedResponse<PendingInvoiceByResponsibleApiRow>>(
        PENDING_INVOICE_BY_RESPONSIBLE_PATH,
        {
          query: buildPaginatedQuery(baseQuery.value, pageParam),
        },
      ),
    getNextPageParam: getNextCursorPageParam,
  });

  watch(
    [hasNextPage, asyncStatus],
    ([canLoadMore, status]) => {
      if (canLoadMore && status !== 'loading') {
        void loadNextPage();
      }
    },
    { immediate: true },
  );

  const rows = computed(() =>
    flattenPaginatedPages<PendingInvoiceByResponsibleApiRow>(
      data.value?.pages,
    ).map(mapPendingInvoiceByResponsibleRow),
  );

  const isInitialLoading = computed(
    () =>
      asyncStatus.value === 'loading' &&
      rows.value.length === 0 &&
      error.value == null,
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
    isInitialLoading,
    isLoadingMore,
    isError,
    errorMessage,
    refresh,
  };
}

function serializeCompanyQuery(
  value: string | string[] | undefined,
): string {
  if (value == null) return '';
  return Array.isArray(value) ? value.join(',') : value;
}
