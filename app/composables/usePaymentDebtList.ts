import type { MaybeRefOrGetter } from 'vue';
import { useInfiniteQuery } from '@pinia/colada';
import { PAYMENT_DEBT_PATH } from '~/constants/payment-api';
import type { PaymentDebtItem } from '~/interfaces/payment/debt';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';
import {
  buildPaymentDebtQuery,
  paymentDebtQueryKey,
  type PaymentDebtFilterInput,
} from '~/utils/payment-debt-query';

export function usePaymentDebtList(
  userId: MaybeRefOrGetter<number | null | undefined>,
  options?: {
    payment?: boolean | null;
    enabled?: MaybeRefOrGetter<boolean>;
  },
) {
  const apiFetch = useApiFetch();

  const resolvedUserId = computed(() => {
    const value = toValue(userId);
    return value != null && Number.isFinite(value) ? value : null;
  });

  const filters = computed((): PaymentDebtFilterInput => ({
    userId: resolvedUserId.value,
    payment: options?.payment ?? false,
  }));

  const isEnabled = computed(() => {
    const extraEnabled = options?.enabled != null ? toValue(options.enabled) : true;
    return extraEnabled && resolvedUserId.value != null;
  });

  const debtQuery = computed(() => buildPaymentDebtQuery(filters.value));

  const {
    data,
    asyncStatus,
    error,
    hasNextPage,
    loadNextPage,
    refresh,
  } = useInfiniteQuery<PaginatedResponse<PaymentDebtItem>, Error, string | null>({
    key: () => paymentDebtQueryKey(filters.value),
    initialPageParam: null,
    enabled: () => isEnabled.value && debtQuery.value != null,
    query: ({ pageParam, signal }) =>
      apiFetch<PaginatedResponse<PaymentDebtItem>>(PAYMENT_DEBT_PATH, {
        query: buildPaginatedQuery(debtQuery.value ?? {}, pageParam),
        signal,
      }),
    getNextPageParam: getNextCursorPageParam,
    refetchOnWindowFocus: false,
  });

  const rows = computed(() =>
    flattenPaginatedPages<PaymentDebtItem>(data.value?.pages),
  );

  const isInitialLoading = computed(
    () => asyncStatus.value === 'loading' && rows.value.length === 0,
  );

  const errorMessage = computed(() =>
    error.value != null ? getFetchErrorMessage(error.value) : '',
  );

  return {
    rows,
    asyncStatus,
    errorMessage,
    isInitialLoading,
    hasNextPage,
    loadNextPage,
    refresh,
  };
}
