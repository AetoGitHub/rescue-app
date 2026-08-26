import { useInfiniteQuery } from '@pinia/colada';
import type { PendingInvoiceColumnMeta } from '~/constants/pending-invoice';
import {
  PENDING_INVOICE_DEFAULT_ADMIN_STATUS,
  PENDING_INVOICE_DEFAULT_ORDERING,
  PENDING_INVOICE_LIST_PATH,
  PENDING_INVOICE_LIST_QUERY_KEY,
  type PendingInvoiceDropdownFilterId,
} from '~/constants/pending-invoice-api';
import type { PendingInvoiceTabValue } from '~/constants/pending-invoice';
import type {
  PendingInvoiceApiRow,
  PendingInvoiceFilterSelection,
} from '~/interfaces/invoicing/pending-invoice';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';
import { mapPendingInvoiceApiRow } from '~/utils/pending-invoice-map';
import { summarizePendingInvoiceRows } from '~/utils/pending-invoice-aggregate';
import {
  pendingInvoiceCsvIdQuery,
  pendingInvoiceOrderingParam,
} from '~/utils/pending-invoice-dashboard-map';
import type { PaginatedQueryValue } from '~/utils/catalog-pagination';

/**
 * Shared pending-invoice state for Por Facturar.
 *
 * Company filter and active tab live in `useState` so matrix → detail jumps
 * stay in sync. Seller/matrix tabs only consume `company`.
 */
export function usePendingInvoiceList() {
  const apiFetch = useApiFetch();
  const selectedCompanies = useState<PendingInvoiceFilterSelection[]>(
    'pending-invoice-companies',
    () => [],
  );
  const selectedClients = useState<PendingInvoiceFilterSelection[]>(
    'pending-invoice-clients',
    () => [],
  );
  const selectedOperators = useState<PendingInvoiceFilterSelection[]>(
    'pending-invoice-operators',
    () => [],
  );
  const selectedVehicles = useState<PendingInvoiceFilterSelection[]>(
    'pending-invoice-vehicles',
    () => [],
  );
  const selectedAuthorizers = useState<PendingInvoiceFilterSelection[]>(
    'pending-invoice-authorizers',
    () => [],
  );
  const ordering = useState<string>(
    'pending-invoice-ordering',
    () => PENDING_INVOICE_DEFAULT_ORDERING,
  );
  const activeTab = useState<PendingInvoiceTabValue>(
    'pending-invoice-tab',
    () => 'detail',
  );

  const companyQuery = computed(() =>
    pendingInvoiceCsvIdQuery(selectedCompanies.value),
  );
  const clientQuery = computed(() =>
    pendingInvoiceCsvIdQuery(selectedClients.value),
  );
  const operatorQuery = computed(() =>
    pendingInvoiceCsvIdQuery(selectedOperators.value),
  );
  const vehicleQuery = computed(() =>
    pendingInvoiceCsvIdQuery(selectedVehicles.value),
  );
  const authorizerQuery = computed(() =>
    pendingInvoiceCsvIdQuery(selectedAuthorizers.value),
  );

  const dropdownSelections: Record<
    PendingInvoiceDropdownFilterId,
    typeof selectedCompanies
  > = {
    company: selectedCompanies,
    client: selectedClients,
    operator: selectedOperators,
    vehicle: selectedVehicles,
    authorizer: selectedAuthorizers,
  };

  const baseQuery = computed(() => {
    const query: Record<string, PaginatedQueryValue> = {
      admin_status: PENDING_INVOICE_DEFAULT_ADMIN_STATUS,
      ordering: ordering.value,
    };
    if (companyQuery.value != null) query.company = companyQuery.value;
    if (clientQuery.value != null) query.client = clientQuery.value;
    if (operatorQuery.value != null) query.operator = operatorQuery.value;
    if (vehicleQuery.value != null) query.vehicle = vehicleQuery.value;
    if (authorizerQuery.value != null) query.authorizer = authorizerQuery.value;
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
      companyQuery.value ?? '',
      clientQuery.value ?? '',
      operatorQuery.value ?? '',
      vehicleQuery.value ?? '',
      authorizerQuery.value ?? '',
      ordering.value,
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

  const scopedRows = computed(() => rows.value);

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
  const errorMessage = computed(
    () => (error.value != null ? getFetchErrorMessage(error.value) : ''),
  );

  function selectionFor(
    key: PendingInvoiceDropdownFilterId,
  ): PendingInvoiceFilterSelection[] {
    return dropdownSelections[key].value;
  }

  function setSelection(
    key: PendingInvoiceDropdownFilterId,
    values: PendingInvoiceFilterSelection[],
  ) {
    dropdownSelections[key].value = values;
  }

  function applyOrdering(
    meta: Pick<PendingInvoiceColumnMeta, 'ordering' | 'invertOrdering'>,
    descending: boolean,
  ) {
    ordering.value = pendingInvoiceOrderingParam(meta, descending);
  }

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

  function clearDetailDropdownFilters() {
    selectedClients.value = [];
    selectedOperators.value = [];
    selectedVehicles.value = [];
    selectedAuthorizers.value = [];
  }

  return {
    rows,
    selectedCompanies,
    selectedClients,
    selectedOperators,
    selectedVehicles,
    selectedAuthorizers,
    companyQuery,
    ordering,
    activeTab,
    scopedRows,
    summary,
    isInitialLoading,
    isLoadingMore,
    isError,
    errorMessage,
    asyncStatus,
    hasNextPage,
    loadNextPage,
    refresh,
    selectionFor,
    setSelection,
    applyOrdering,
    focusCompany,
    clearCompanies,
    clearDetailDropdownFilters,
  };
}
