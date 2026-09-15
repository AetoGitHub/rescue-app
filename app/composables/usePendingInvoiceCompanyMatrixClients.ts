import { useQuery } from '@pinia/colada';
import type { MaybeRefOrGetter } from 'vue';
import {
  PENDING_INVOICE_COMPANY_MATRIX_CLIENTS_PATH,
  PENDING_INVOICE_COMPANY_MATRIX_CLIENTS_QUERY_KEY,
} from '~/constants/pending-invoice-api';
import type { PendingInvoiceCompanyMatrixClientsApiResponse } from '~/interfaces/invoicing/pending-invoice';
import { mapPendingInvoiceCompanyMatrixClients } from '~/utils/pending-invoice-dashboard-map';

/**
 * Client drill-down for one company row of the matrix, from
 * `/api/dashboard/company_matrix/<pk>/clients/`. Mount the calling
 * component only while the row is expanded to fetch lazily.
 */
export function usePendingInvoiceCompanyMatrixClients(
  companyId: MaybeRefOrGetter<number | null>,
  months: MaybeRefOrGetter<number>,
) {
  const apiFetch = useApiFetch();
  const { startDateQuery, endDateQuery } = usePendingInvoiceList();
  const id = computed(() => toValue(companyId));

  const { data, asyncStatus, error, refresh } = useQuery({
    key: () => [
      PENDING_INVOICE_COMPANY_MATRIX_CLIENTS_QUERY_KEY,
      String(id.value ?? ''),
      String(toValue(months)),
      startDateQuery.value ?? '',
      endDateQuery.value ?? '',
    ],
    enabled: () => id.value != null,
    query: ({ signal }) => {
      const query: Record<string, string> = { months: String(toValue(months)) };
      if (startDateQuery.value != null) query.start_date = startDateQuery.value;
      if (endDateQuery.value != null) query.end_date = endDateQuery.value;
      return apiFetch<PendingInvoiceCompanyMatrixClientsApiResponse>(
        PENDING_INVOICE_COMPANY_MATRIX_CLIENTS_PATH(id.value as number),
        { query, signal },
      );
    },
  });

  const rows = computed(() =>
    mapPendingInvoiceCompanyMatrixClients(data.value?.clients ?? []),
  );
  const isLoading = computed(
    () => asyncStatus.value === 'loading' && data.value == null,
  );
  const isError = computed(() => error.value != null);
  const errorMessage = computed(() =>
    error.value != null ? getFetchErrorMessage(error.value) : '',
  );

  return { rows, isLoading, isError, errorMessage, refresh };
}
