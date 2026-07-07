import { useQuery } from '@pinia/colada';
import { PENDING_INVOICE_API_PATHS } from '~/constants/pending-invoice-api';
import type { PendingInvoiceSummary } from '~/interfaces/invoicing/pending-invoice';

export function usePendingInvoiceSummary() {
  const apiFetch = useApiFetch();

  const { data, asyncStatus, error, refresh } = useQuery({
    key: () => ['pending-invoice-summary'],
    query: () =>
      apiFetch<PendingInvoiceSummary>(PENDING_INVOICE_API_PATHS.summary),
  });

  const isInitialLoading = computed(
    () => asyncStatus.value === 'loading' && data.value == null && error.value == null,
  );
  const isError = computed(() => error.value != null);
  const errorMessage = computed(() =>
    error.value != null ? getFetchErrorMessage(error.value) : '',
  );

  return {
    summary: data,
    asyncStatus,
    isInitialLoading,
    isError,
    errorMessage,
    refresh,
  };
}
