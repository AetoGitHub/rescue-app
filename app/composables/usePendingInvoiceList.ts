import { useInfiniteQuery } from '@pinia/colada';
import {
  PENDING_INVOICE_DEFAULT_ADMIN_STATUS,
  PENDING_INVOICE_LIST_PATH,
  PENDING_INVOICE_LIST_QUERY_KEY,
} from '~/constants/pending-invoice-api';
import type { PendingInvoiceTabValue } from '~/constants/pending-invoice';
import type { PendingInvoiceApiRow } from '~/interfaces/invoicing/pending-invoice';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';
import { mapPendingInvoiceApiRow } from '~/utils/pending-invoice-map';
import {
  collectPendingInvoiceCompanies,
  filterPendingInvoiceRows,
  summarizePendingInvoiceRows,
} from '~/utils/pending-invoice-aggregate';

/**
 * Shared pending-invoice list for the three Por Facturar tabs.
 *
 * Company filter and active tab live in `useState` so matrix → detail jumps
 * stay in sync. Seller/matrix aggregates need the full cursor window, so pages
 * keep loading until `next` is exhausted.
 */
export function usePendingInvoiceList() {
  const apiFetch = useApiFetch();
  const selectedCompanies = useState<string[]>(
    'pending-invoice-companies',
    () => [],
  );
  const activeTab = useState<PendingInvoiceTabValue>(
    'pending-invoice-tab',
    () => 'detail',
  );

  const baseQuery = computed(() => ({
    admin_status: PENDING_INVOICE_DEFAULT_ADMIN_STATUS,
  }));

  const {
    data,
    asyncStatus,
    hasNextPage,
    loadNextPage,
    error,
    refresh,
  } = useInfiniteQuery<
    PaginatedResponse<PendingInvoiceApiRow>,
    Error,
    string | null
  >({
    key: () => [PENDING_INVOICE_LIST_QUERY_KEY],
    initialPageParam: null,
    query: ({ pageParam }) =>
      apiFetch<PaginatedResponse<PendingInvoiceApiRow>>(
        PENDING_INVOICE_LIST_PATH,
        {
          query: buildPaginatedQuery(baseQuery.value, pageParam),
        },
      ),
    getNextPageParam: getNextCursorPageParam,
  });

  // Drain the cursor so seller/matrix aggregates see the full filtered set.
  watch(
    [hasNextPage, asyncStatus],
    ([canLoadMore, status]) => {
      if (canLoadMore && status !== 'loading') {
        void loadNextPage();
      }
    },
    { immediate: true },
  );

  const rows = computed(() => {
    const reference = new Date();
    return flattenPaginatedPages<PendingInvoiceApiRow>(data.value?.pages).map(
      raw => mapPendingInvoiceApiRow(raw, reference),
    );
  });

  const companies = computed(() => collectPendingInvoiceCompanies(rows.value));

  const scopedRows = computed(() =>
    filterPendingInvoiceRows(rows.value, {
      companies: selectedCompanies.value,
    }),
  );

  const summary = computed(() => summarizePendingInvoiceRows(scopedRows.value));

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

  function focusCompany(compania: string) {
    selectedCompanies.value = [compania];
    activeTab.value = 'detail';
  }

  function clearCompanies() {
    selectedCompanies.value = [];
  }

  return {
    rows,
    companies,
    selectedCompanies,
    activeTab,
    scopedRows,
    summary,
    isInitialLoading,
    isLoadingMore,
    isError,
    errorMessage,
    hasNextPage,
    loadNextPage,
    refresh,
    focusCompany,
    clearCompanies,
  };
}
