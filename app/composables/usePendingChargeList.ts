import { useInfiniteQuery } from '@pinia/colada';
import type { PendingChargeColumnMeta } from '~/constants/pending-charge';
import {
  PENDING_CHARGE_LIST_PATH,
  PENDING_CHARGE_LIST_QUERY_KEY,
  type PendingChargeDropdownFilterId,
} from '~/constants/pending-charge-api';
import type {
  PendingChargeApiRow,
  PendingChargeFilterSelection,
  PendingChargeStatus,
} from '~/interfaces/invoicing/pending-charge';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';
import type { PaginatedQueryValue } from '~/utils/catalog-pagination';

/**
 * Shared pending-charge state for Por Cobrar.
 *
 * Company/client/status filters live in `useState` so the page header and
 * column popovers stay in sync.
 */
export function usePendingChargeList() {
  const apiFetch = useApiFetch();
  const selectedCompanies = useState<PendingChargeFilterSelection[]>(
    'pending-charge-companies',
    () => [],
  );
  const selectedClients = useState<PendingChargeFilterSelection[]>(
    'pending-charge-clients',
    () => [],
  );
  const selectedStatuses = useState<PendingChargeStatus[]>(
    'pending-charge-statuses',
    () => [],
  );
  const ordering = useState<string | null>(
    'pending-charge-ordering',
    () => null,
  );

  const companyQuery = computed(() =>
    pendingChargeCsvIdQuery(selectedCompanies.value),
  );
  const clientQuery = computed(() =>
    pendingChargeCsvIdQuery(selectedClients.value),
  );
  const statusQuery = computed(() =>
    pendingChargeStatusQuery(selectedStatuses.value),
  );

  const dropdownSelections: Record<
    PendingChargeDropdownFilterId,
    typeof selectedCompanies
  > = {
    company: selectedCompanies,
    client: selectedClients,
  };

  const baseQuery = computed(() => {
    const query: Record<string, PaginatedQueryValue> = {};
    if (ordering.value) query.ordering = ordering.value;
    if (companyQuery.value != null) query.company = companyQuery.value;
    if (clientQuery.value != null) query.client = clientQuery.value;
    if (statusQuery.value != null) query.status = statusQuery.value;
    return query;
  });

  const {
    data,
    asyncStatus,
    hasNextPage,
    loadNextPage: fetchNextPage,
    isPending,
    error,
    refresh,
  } = useInfiniteQuery<
    PaginatedResponse<PendingChargeApiRow>,
    Error,
    string | null
  >({
    key: () => [
      PENDING_CHARGE_LIST_QUERY_KEY,
      companyQuery.value ?? '',
      clientQuery.value ?? '',
      statusQuery.value ?? '',
      ordering.value,
    ],
    initialPageParam: null,
    query: ({ pageParam }) =>
      apiFetch<PaginatedResponse<PendingChargeApiRow>>(
        PENDING_CHARGE_LIST_PATH,
        {
          query: buildPaginatedQuery(baseQuery.value, pageParam),
        },
      ),
    getNextPageParam: getNextCursorPageParam,
  });

  const rows = computed(() =>
    flattenPaginatedPages<PendingChargeApiRow>(data.value?.pages).map(
      mapPendingChargeApiRow,
    ),
  );

  const isFetchingNextPage = ref(false);

  const isInitialLoading = computed(
    () =>
      (asyncStatus.value === 'loading' || isPending.value)
      && rows.value.length === 0
      && error.value == null,
  );
  const isLoadingMore = computed(
    () =>
      isFetchingNextPage.value
      || (asyncStatus.value === 'loading' && rows.value.length > 0),
  );

  function loadNextPage() {
    if (
      !canLoadNextCursorPage({
        hasNextPage: hasNextPage.value,
        isFetchingNextPage: isFetchingNextPage.value,
        isPending: isPending.value || asyncStatus.value === 'loading',
      })
    ) {
      return;
    }

    isFetchingNextPage.value = true;
    return Promise.resolve(fetchNextPage()).finally(() => {
      isFetchingNextPage.value = false;
    });
  }
  const isError = computed(() => error.value != null);
  const errorMessage = computed(
    () => (error.value != null ? getFetchErrorMessage(error.value) : ''),
  );

  function selectionFor(
    key: PendingChargeDropdownFilterId,
  ): PendingChargeFilterSelection[] {
    return dropdownSelections[key].value;
  }

  function setSelection(
    key: PendingChargeDropdownFilterId,
    values: PendingChargeFilterSelection[],
  ) {
    dropdownSelections[key].value = values;
  }

  function applyOrdering(
    meta: Pick<PendingChargeColumnMeta, 'ordering'>,
    descending: boolean,
  ) {
    ordering.value = pendingChargeOrderingParam(meta, descending) || null;
  }

  function clearCompanies() {
    selectedCompanies.value = [];
  }

  function clearDetailFilters() {
    selectedClients.value = [];
    selectedStatuses.value = [];
  }

  return {
    rows,
    selectedCompanies,
    selectedClients,
    selectedStatuses,
    companyQuery,
    clientQuery,
    statusQuery,
    ordering,
    isInitialLoading,
    isLoadingMore,
    isFetchingNextPage,
    isError,
    errorMessage,
    asyncStatus,
    hasNextPage,
    loadNextPage,
    refresh,
    selectionFor,
    setSelection,
    applyOrdering,
    clearCompanies,
    clearDetailFilters,
  };
}
