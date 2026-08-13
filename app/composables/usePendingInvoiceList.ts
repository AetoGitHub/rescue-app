import { useInfiniteQuery } from '@pinia/colada';
import {
  PENDING_INVOICE_DEFAULT_ADMIN_STATUS,
  PENDING_INVOICE_LIST_PATH,
  PENDING_INVOICE_LIST_QUERY_KEY,
} from '~/constants/pending-invoice-api';
import type { PendingInvoiceTabValue } from '~/constants/pending-invoice';
import type {
  PendingInvoiceApiRow,
  PendingInvoiceCompanySelection,
} from '~/interfaces/invoicing/pending-invoice';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';
import { mapPendingInvoiceApiRow } from '~/utils/pending-invoice-map';
import {
  filterPendingInvoiceRows,
  summarizePendingInvoiceRows,
} from '~/utils/pending-invoice-aggregate';
import { pendingInvoiceCompanyQuery } from '~/utils/pending-invoice-dashboard-map';
import type { PaginatedQueryValue } from '~/utils/catalog-pagination';

/**
 * Shared pending-invoice state for Por Facturar.
 *
 * Company filter and active tab live in `useState` so matrix → detail jumps
 * stay in sync. Seller/matrix tabs fetch their own endpoints.
 */
export function usePendingInvoiceList() {
  const apiFetch = useApiFetch();
  const selectedCompanies = useState<PendingInvoiceCompanySelection[]>(
    'pending-invoice-companies',
    () => [],
  );
  const activeTab = useState<PendingInvoiceTabValue>(
    'pending-invoice-tab',
    () => 'detail',
  );

  const companyQuery = computed(() =>
    pendingInvoiceCompanyQuery(selectedCompanies.value),
  );
  const companyNames = computed(() =>
    selectedCompanies.value.map(company => company.name).filter(Boolean),
  );

  const baseQuery = computed(() => {
    const query: Record<string, PaginatedQueryValue> = {
      admin_status: PENDING_INVOICE_DEFAULT_ADMIN_STATUS,
    };
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
    PaginatedResponse<PendingInvoiceApiRow>,
    Error,
    string | null
  >({
    key: () => [
      PENDING_INVOICE_LIST_QUERY_KEY,
      serializeCompanyQuery(companyQuery.value),
    ],
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

  const rows = computed(() => {
    const reference = new Date();
    return flattenPaginatedPages<PendingInvoiceApiRow>(data.value?.pages).map(
      raw => mapPendingInvoiceApiRow(raw, reference),
    );
  });

  /** Client-side name filter as a safety net while the API may ignore `company`. */
  const scopedRows = computed(() =>
    filterPendingInvoiceRows(rows.value, {
      companies: companyNames.value,
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

  function focusCompany(input: {
    id?: number | null;
    name: string;
  }) {
    const name = input.name.trim();
    if (!name) return;
    const id =
      input.id != null && Number.isFinite(input.id) && input.id > 0
        ? input.id
        : 0;
    selectedCompanies.value = [{ id, name }];
    activeTab.value = 'detail';
  }

  function clearCompanies() {
    selectedCompanies.value = [];
  }

  return {
    rows,
    selectedCompanies,
    companyQuery,
    companyNames,
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

function serializeCompanyQuery(
  value: string | string[] | undefined,
): string {
  if (value == null) return '';
  return Array.isArray(value) ? value.join(',') : value;
}
