import { useQuery } from '@pinia/colada';
import {
  PENDING_INVOICE_CLIENT_SUMMARY_PATH,
  PENDING_INVOICE_DEFAULT_ADMIN_STATUS,
  PENDING_INVOICE_SUMMARY_PATH,
  PENDING_INVOICE_SUMMARY_QUERY_KEY,
} from '~/constants/pending-invoice-api';
import type { DashboardBillingSummary } from '~/interfaces/invoicing/dashboard-summary';
import type { PaginatedQueryValue } from '~/utils/catalog-pagination';

/**
 * Sibling of `GET /api/dashboard/pending_invoice/`:
 * `GET /api/dashboard/pending_invoice/summary/`.
 *
 * Reuses the same dropdown and date filters as `usePendingInvoiceList`.
 * En el portal de cliente usa `/api/client/pending_invoice/summary/` y manda
 * el mismo `?clients=` que el listado.
 */
export function usePendingInvoiceSummary() {
  const apiFetch = useApiFetch();
  const {
    companyQuery,
    clientQuery,
    operatorQuery,
    vehicleQuery,
    authorizerQuery,
    startDateQuery,
    endDateQuery,
    clientsQuery,
  } = usePendingInvoiceList();
  const reportScope = usePendingReportScope();

  const summaryPath = computed(() =>
    reportScope.value === 'client'
      ? PENDING_INVOICE_CLIENT_SUMMARY_PATH
      : PENDING_INVOICE_SUMMARY_PATH,
  );

  const baseQuery = computed(() => {
    const query: Record<string, PaginatedQueryValue> = {
      admin_status: PENDING_INVOICE_DEFAULT_ADMIN_STATUS,
    };
    if (companyQuery.value != null) query.company = companyQuery.value;
    if (clientQuery.value != null) query.client = clientQuery.value;
    if (operatorQuery.value != null) query.operator = operatorQuery.value;
    if (vehicleQuery.value != null) query.vehicle = vehicleQuery.value;
    if (authorizerQuery.value != null) query.authorizer = authorizerQuery.value;
    if (startDateQuery.value != null) query.start_date = startDateQuery.value;
    if (endDateQuery.value != null) query.end_date = endDateQuery.value;
    if (clientsQuery.value != null) query.clients = clientsQuery.value;
    return query;
  });

  const { data, asyncStatus, error, refresh } = useQuery({
    key: () => [
      PENDING_INVOICE_SUMMARY_QUERY_KEY,
      reportScope.value,
      companyQuery.value ?? '',
      clientQuery.value ?? '',
      operatorQuery.value ?? '',
      vehicleQuery.value ?? '',
      authorizerQuery.value ?? '',
      startDateQuery.value ?? '',
      endDateQuery.value ?? '',
      clientsQuery.value ?? '',
    ],
    query: ({ signal }) =>
      apiFetch<unknown>(summaryPath.value, {
        query: baseQuery.value,
        signal,
      }),
  });

  const summary = computed<DashboardBillingSummary>(() =>
    data.value != null
      ? mapDashboardBillingSummary(data.value)
      : EMPTY_DASHBOARD_BILLING_SUMMARY,
  );
  // Solo la primera carga: en un refetch se conservan los totales anteriores.
  const isLoading = computed(
    () => asyncStatus.value === 'loading' && data.value == null,
  );
  const isError = computed(() => error.value != null);

  return {
    summary,
    isLoading,
    isError,
    refresh,
  };
}
