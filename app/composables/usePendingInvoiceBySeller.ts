import { useQuery } from '@pinia/colada';
import { PENDING_INVOICE_API_PATHS } from '~/constants/pending-invoice-api';
import type { PendingInvoiceBySellerRow } from '~/interfaces/invoicing/pending-invoice';

export function usePendingInvoiceBySeller() {
  const apiFetch = useApiFetch();

  const { data, asyncStatus, error, refresh } = useQuery({
    key: () => ['pending-invoice-by-seller'],
    query: () =>
      apiFetch<PendingInvoiceBySellerRow[]>(PENDING_INVOICE_API_PATHS.bySeller),
  });

  const rows = computed(() => data.value ?? []);

  const totalAmount = computed(() =>
    rows.value.reduce((sum, row) => sum + row.total, 0),
  );

  const footerTotals = computed(() => ({
    eventos: rows.value.reduce((sum, row) => sum + row.eventos, 0),
    total: totalAmount.value,
  }));

  const isInitialLoading = computed(
    () => asyncStatus.value === 'loading' && data.value == null && error.value == null,
  );
  const isError = computed(() => error.value != null);
  const errorMessage = computed(() =>
    error.value != null ? getFetchErrorMessage(error.value) : '',
  );

  return {
    rows,
    totalAmount,
    footerTotals,
    asyncStatus,
    isInitialLoading,
    isError,
    errorMessage,
    refresh,
  };
}
