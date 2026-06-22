import { refDebounced } from '@vueuse/core';
import { useInfiniteQuery } from '@pinia/colada';
import type { CalendarDate } from '@internationalized/date';
import {
  PAYMENT_OPERATIVE_LIST_PATH,
  PAYMENT_SELLER_LIST_PATH,
  type PaymentRecipientType,
} from '~/constants/payment-api';
import type { PaymentListItem } from '~/interfaces/payment/payment-list';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';
import {
  buildPaymentListQuery,
  paymentListQueryKey,
  type PaymentListFilterInput,
} from '~/utils/payment-list-query';

function emptyAppliedFilters(): PaymentListFilterInput {
  return {
    type: 'operative',
    userId: null,
    folio: '',
    fromDate: null,
    toDate: null,
  };
}

export function usePaymentList() {
  const apiFetch = useApiFetch();

  const recipientType = ref<PaymentRecipientType>('operative');
  const userId = ref<number | null>(null);
  const folio = ref('');
  const debouncedFolio = refDebounced(folio, 300);
  const fromDate = ref<CalendarDate | null>(null);
  const toDate = ref<CalendarDate | null>(null);
  const appliedFilters = ref<PaymentListFilterInput>(emptyAppliedFilters());
  const selectedIds = ref<Set<number>>(new Set());

  const listPath = computed(() =>
    appliedFilters.value.type === 'operative'
      ? PAYMENT_OPERATIVE_LIST_PATH
      : PAYMENT_SELLER_LIST_PATH,
  );

  const listQuery = computed(() => buildPaymentListQuery(appliedFilters.value));

  const {
    data,
    asyncStatus,
    hasNextPage,
    loadNextPage,
    isPending,
  } = useInfiniteQuery<PaginatedResponse<PaymentListItem>, Error, string | null>({
    key: () => paymentListQueryKey(appliedFilters.value),
    initialPageParam: null,
    enabled: () => listQuery.value != null,
    query: ({ pageParam }) =>
      apiFetch<PaginatedResponse<PaymentListItem>>(listPath.value, {
        query: buildPaginatedQuery(listQuery.value ?? {}, pageParam),
      }),
    getNextPageParam: getNextCursorPageParam,
  });

  const rows = computed(() =>
    flattenPaginatedPages<PaymentListItem>(data.value?.pages),
  );

  const isInitialLoading = computed(
    () => asyncStatus.value === 'loading' && rows.value.length === 0,
  );

  const hasSearched = computed(() => appliedFilters.value.userId != null);

  const allVisibleSelected = computed(() => {
    if (rows.value.length === 0) return false;
    return rows.value.every((row) => selectedIds.value.has(row.id));
  });

  const someVisibleSelected = computed(() =>
    rows.value.some((row) => selectedIds.value.has(row.id)),
  );

  function clearSelection() {
    selectedIds.value = new Set();
  }

  function syncAppliedFilters(options?: { folio?: string }) {
    const folioValue = options?.folio ?? debouncedFolio.value;

    if (userId.value == null) {
      appliedFilters.value = {
        ...emptyAppliedFilters(),
        type: recipientType.value,
        folio: folioValue,
      };
      clearSelection();
      return;
    }

    appliedFilters.value = {
      type: recipientType.value,
      userId: userId.value,
      folio: folioValue,
      fromDate: fromDate.value,
      toDate: toDate.value,
    };
    clearSelection();
  }

  function selectAllVisible() {
    selectedIds.value = new Set(rows.value.map((row) => row.id));
  }

  function deselectAllVisible() {
    const visible = new Set(rows.value.map((row) => row.id));
    selectedIds.value = new Set(
      [...selectedIds.value].filter((id) => !visible.has(id)),
    );
  }

  function selectIds(ids: number[]) {
    const next = new Set(selectedIds.value);
    for (const id of ids) next.add(id);
    selectedIds.value = next;
  }

  function toggleRow(id: number, checked: boolean) {
    const next = new Set(selectedIds.value);
    if (checked) next.add(id);
    else next.delete(id);
    selectedIds.value = next;
  }

  function isRowSelected(id: number) {
    return selectedIds.value.has(id);
  }

  const selectedIdList = computed(() => [...selectedIds.value]);

  watch(userId, () => {
    syncAppliedFilters(userId.value == null ? { folio: '' } : undefined);
  });

  watch(debouncedFolio, () => {
    if (userId.value == null) return;
    syncAppliedFilters();
  });

  watch([fromDate, toDate], () => {
    if (userId.value == null) return;
    syncAppliedFilters();
  });

  watch(recipientType, () => {
    userId.value = null;
    folio.value = '';
    fromDate.value = null;
    toDate.value = null;
  });

  return {
    recipientType,
    userId,
    folio,
    fromDate,
    toDate,
    appliedFilters,
    rows,
    asyncStatus,
    hasNextPage,
    loadNextPage,
    isPending,
    isInitialLoading,
    hasSearched,
    selectedIds,
    selectedIdList,
    allVisibleSelected,
    someVisibleSelected,
    clearSelection,
    selectAllVisible,
    deselectAllVisible,
    selectIds,
    toggleRow,
    isRowSelected,
  };
}
