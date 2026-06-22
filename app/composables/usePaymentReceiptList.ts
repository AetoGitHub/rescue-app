import { useInfiniteQuery } from '@pinia/colada';
import type { CalendarDate } from '@internationalized/date';
import { PAYMENT_RECEIPT_PATH } from '~/constants/payment-api';
import type { PaymentRecipientType } from '~/constants/payment-api';
import type { PaymentReceiptListItem } from '~/interfaces/payment/receipt';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';
import {
  buildPaymentReceiptListQuery,
  paymentReceiptListQueryKey,
  type PaymentReceiptListFilterInput,
} from '~/utils/payment-receipt-list-query';

function emptyAppliedFilters(): PaymentReceiptListFilterInput {
  return {
    paymentType: null,
    userId: null,
    fromDate: null,
    toDate: null,
  };
}

export function usePaymentReceiptList() {
  const apiFetch = useApiFetch();

  const paymentType = ref<PaymentRecipientType | null>(null);
  const userId = ref<number | null>(null);
  const fromDate = ref<CalendarDate | null>(null);
  const toDate = ref<CalendarDate | null>(null);
  const appliedFilters = ref<PaymentReceiptListFilterInput>(emptyAppliedFilters());

  const listQuery = computed(() =>
    buildPaymentReceiptListQuery(appliedFilters.value),
  );

  const {
    data,
    asyncStatus,
    hasNextPage,
    loadNextPage,
    isPending,
  } = useInfiniteQuery<PaginatedResponse<PaymentReceiptListItem>, Error, string | null>({
    key: () => paymentReceiptListQueryKey(appliedFilters.value),
    initialPageParam: null,
    query: ({ pageParam }) =>
      apiFetch<PaginatedResponse<PaymentReceiptListItem>>(PAYMENT_RECEIPT_PATH, {
        query: buildPaginatedQuery(listQuery.value, pageParam),
      }),
    getNextPageParam: getNextCursorPageParam,
  });

  const rows = computed(() =>
    flattenPaginatedPages<PaymentReceiptListItem>(data.value?.pages),
  );

  const isInitialLoading = computed(
    () => asyncStatus.value === 'loading' && rows.value.length === 0,
  );

  function syncAppliedFilters() {
    appliedFilters.value = {
      paymentType: paymentType.value,
      userId: userId.value,
      fromDate: fromDate.value,
      toDate: toDate.value,
    };
  }

  watch(paymentType, () => {
    userId.value = null;
    syncAppliedFilters();
  });

  watch(userId, () => {
    syncAppliedFilters();
  });

  watch([fromDate, toDate], () => {
    syncAppliedFilters();
  });

  onMounted(() => {
    syncAppliedFilters();
  });

  return {
    paymentType,
    userId,
    fromDate,
    toDate,
    appliedFilters,
    rows,
    asyncStatus,
    hasNextPage,
    loadNextPage,
    isPending,
    isInitialLoading,
  };
}
