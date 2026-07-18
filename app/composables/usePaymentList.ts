import { refDebounced } from '@vueuse/core';
import { useInfiniteQuery } from '@pinia/colada';
import {
  PAYMENT_OPERATIVE_LIST_PATH,
  PAYMENT_SELLER_LIST_PATH,
  type PaymentListPaymentStatus,
  type PaymentRecipientType,
} from '~/constants/payment-api';
import type { PaymentListItem } from '~/interfaces/payment/payment-list';
import { emptyCatalogDropdownSelection } from '~/interfaces/shared/catalog-dropdown.interface';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';
import {
  buildPaymentListQuery,
  isPaymentListRowSelectable,
  normalizePaymentListItem,
  paymentListQueryKey,
  paymentStatusToFilterValue,
  type CalendarDateParts,
  type PaymentListFilterInput,
} from '~/utils/payment-list-query';

function emptyAppliedFilters(): PaymentListFilterInput {
  return {
    type: 'operative',
    userId: null,
    folio: '',
    fromDate: null,
    toDate: null,
    payment: null,
  };
}

export function usePaymentList() {
  const apiFetch = useApiFetch();

  const recipientType = ref<PaymentRecipientType>('operative');
  const user = ref(emptyCatalogDropdownSelection());
  const folio = ref('');
  const debouncedFolio = refDebounced(folio, 300);
  const fromDate = ref<CalendarDateParts | null>(null);
  const toDate = ref<CalendarDateParts | null>(null);
  const paymentStatus = ref<PaymentListPaymentStatus>('all');
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
    flattenPaginatedPages<PaymentListItem>(data.value?.pages).map(
      normalizePaymentListItem,
    ),
  );

  const isInitialLoading = computed(
    () => asyncStatus.value === 'loading' && rows.value.length === 0,
  );

  const hasSearched = computed(() => appliedFilters.value.userId != null);

  const selectableRows = computed(() =>
    rows.value.filter(isPaymentListRowSelectable),
  );

  const allVisibleSelected = computed(() => {
    if (selectableRows.value.length === 0) return false;
    return selectableRows.value.every((row) => selectedIds.value.has(row.id));
  });

  const someVisibleSelected = computed(() =>
    selectableRows.value.some((row) => selectedIds.value.has(row.id)),
  );

  function clearSelection() {
    selectedIds.value = new Set();
  }

  function syncAppliedFilters(options?: { folio?: string }) {
    const folioValue = options?.folio ?? debouncedFolio.value;
    const userId = user.value.value;

    if (userId == null) {
      appliedFilters.value = {
        ...emptyAppliedFilters(),
        type: recipientType.value,
        folio: folioValue,
        payment: paymentStatusToFilterValue(paymentStatus.value),
      };
      clearSelection();
      return;
    }

    appliedFilters.value = {
      type: recipientType.value,
      userId,
      folio: folioValue,
      fromDate: fromDate.value,
      toDate: toDate.value,
      payment: paymentStatusToFilterValue(paymentStatus.value),
    };
    clearSelection();
  }

  function selectAllVisible() {
    selectedIds.value = new Set(selectableRows.value.map((row) => row.id));
  }

  function deselectAllVisible() {
    const visible = new Set(rows.value.map((row) => row.id));
    selectedIds.value = new Set(
      [...selectedIds.value].filter((id) => !visible.has(id)),
    );
  }

  function selectIds(ids: number[]) {
    const selectableIds = new Set(selectableRows.value.map((row) => row.id));
    const next = new Set(selectedIds.value);
    for (const id of ids) {
      if (selectableIds.has(id)) next.add(id);
    }
    selectedIds.value = next;
  }

  function toggleRow(id: number, checked: boolean) {
    if (checked) {
      const row = rows.value.find((item) => item.id === id);
      if (row != null && !isPaymentListRowSelectable(row)) return;
    }

    const next = new Set(selectedIds.value);
    if (checked) next.add(id);
    else next.delete(id);
    selectedIds.value = next;
  }

  function isRowSelected(id: number) {
    return selectedIds.value.has(id);
  }

  const selectedIdList = computed(() => [...selectedIds.value]);

  watch(
    () => user.value.value,
    () => {
      syncAppliedFilters(user.value.value == null ? { folio: '' } : undefined);
    },
  );

  watch(debouncedFolio, () => {
    if (user.value.value == null) return;
    syncAppliedFilters();
  });

  watch([fromDate, toDate], () => {
    if (user.value.value == null) return;
    syncAppliedFilters();
  });

  watch(paymentStatus, () => {
    if (user.value.value == null) return;
    syncAppliedFilters();
  });

  watch(recipientType, () => {
    user.value = emptyCatalogDropdownSelection();
    folio.value = '';
    fromDate.value = null;
    toDate.value = null;
    paymentStatus.value = 'all';
  });

  watch(
    rows,
    (nextRows) => {
      const paidIds = new Set(
        nextRows.filter((row) => row.payment).map((row) => row.id),
      );
      if (paidIds.size === 0) return;

      const nextSelected = new Set(selectedIds.value);
      let changed = false;
      for (const id of paidIds) {
        if (nextSelected.delete(id)) changed = true;
      }
      if (changed) selectedIds.value = nextSelected;
    },
    { deep: true },
  );

  return {
    recipientType,
    user,
    folio,
    fromDate,
    toDate,
    paymentStatus,
    appliedFilters,
    rows,
    asyncStatus,
    hasNextPage,
    loadNextPage,
    isPending,
    isInitialLoading,
    hasSearched,
    selectableRows,
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
