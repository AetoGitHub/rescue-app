import { useQuery } from '@pinia/colada';
import type { MaybeRefOrGetter } from 'vue';
import { paymentReceiptDetailPath } from '~/constants/payment-api';
import type { PaymentReceiptDetail } from '~/interfaces/payment/receipt';

export function usePaymentReceipt(
  receiptId: MaybeRefOrGetter<number | null | undefined>,
) {
  const apiFetch = useApiFetch();

  const resolvedReceiptId = computed(() => {
    const value = toValue(receiptId);
    if (value == null || !Number.isFinite(value) || value <= 0) return null;
    return Math.trunc(value);
  });

  const {
    data: receipt,
    asyncStatus,
    error,
    refresh,
  } = useQuery({
    key: () => ['payment-receipt', resolvedReceiptId.value ?? ''],
    enabled: () => resolvedReceiptId.value != null,
    query: ({ signal }) =>
      apiFetch<PaymentReceiptDetail>(
        paymentReceiptDetailPath(resolvedReceiptId.value!),
        { signal },
      ),
    refetchOnWindowFocus: false,
  });

  const isLoading = computed(() => asyncStatus.value === 'loading');

  const errorMessage = computed(() =>
    error.value != null ? getFetchErrorMessage(error.value) : '',
  );

  return {
    receipt,
    isLoading,
    errorMessage,
    refresh,
  };
}
