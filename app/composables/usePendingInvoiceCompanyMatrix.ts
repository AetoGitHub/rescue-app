import { useQuery } from '@pinia/colada';
import type { MaybeRefOrGetter } from 'vue';
import { PENDING_INVOICE_API_PATHS } from '~/constants/pending-invoice-api';
import type {
  PendingInvoiceCompanyMatrixRow,
  PendingInvoiceMatrixMonthCell,
} from '~/interfaces/invoicing/pending-invoice';
import { collectMatrixMonthKeys } from '~/utils/pending-invoice-display';

export function usePendingInvoiceCompanyMatrix(
  months: MaybeRefOrGetter<number> = 6,
) {
  const apiFetch = useApiFetch();
  const monthsValue = computed(() => toValue(months));

  const { data, asyncStatus, error, refresh } = useQuery({
    key: () => ['pending-invoice-company-matrix', String(monthsValue.value)],
    query: () =>
      apiFetch<PendingInvoiceCompanyMatrixRow[]>(
        PENDING_INVOICE_API_PATHS.companyMatrix,
        {
          query: { months: String(monthsValue.value) },
        },
      ),
  });

  const rows = computed(() => data.value ?? []);

  const monthKeys = computed(() => collectMatrixMonthKeys(rows.value));

  const footerTotals = computed(() => {
    const byMonth: Record<string, PendingInvoiceMatrixMonthCell> = {};
    let grandTotal = 0;
    let grandEvents = 0;

    for (const monthKey of monthKeys.value) {
      byMonth[monthKey] = { monto: 0, eventos: 0 };
    }

    for (const row of rows.value) {
      grandTotal += row.total;
      for (const monthKey of monthKeys.value) {
        const cell = row.meses[monthKey];
        const bucket = byMonth[monthKey];
        if (cell && bucket) {
          bucket.monto += cell.monto;
          bucket.eventos += cell.eventos;
          grandEvents += cell.eventos;
        }
      }
    }

    return { byMonth, grandTotal, grandEvents };
  });

  const matrixSummary = computed(() => ({
    companies: rows.value.length,
    events: footerTotals.value.grandEvents,
    totalConIva: footerTotals.value.grandTotal,
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
    monthKeys,
    footerTotals,
    matrixSummary,
    asyncStatus,
    isInitialLoading,
    isError,
    errorMessage,
    refresh,
  };
}
