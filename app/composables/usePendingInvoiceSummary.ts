import { useQuery } from '@pinia/colada';
import {
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
 * Reuses the same dropdown filters as `usePendingInvoiceList`.
 */
export function usePendingInvoiceSummary() {
  const apiFetch = useApiFetch();
  const {
    companyQuery,
    clientQuery,
    operatorQuery,
    vehicleQuery,
    authorizerQuery,
  } = usePendingInvoiceList();

  const baseQuery = computed(() => {
    const query: Record<string, PaginatedQueryValue> = {
      admin_status: PENDING_INVOICE_DEFAULT_ADMIN_STATUS,
    };
    if (companyQuery.value != null) query.company = companyQuery.value;
    if (clientQuery.value != null) query.client = clientQuery.value;
    if (operatorQuery.value != null) query.operator = operatorQuery.value;
    if (vehicleQuery.value != null) query.vehicle = vehicleQuery.value;
    if (authorizerQuery.value != null) query.authorizer = authorizerQuery.value;
    return query;
  });

  const { data, asyncStatus, error, refresh } = useQuery({
    key: () => [
      PENDING_INVOICE_SUMMARY_QUERY_KEY,
      companyQuery.value ?? '',
      clientQuery.value ?? '',
      operatorQuery.value ?? '',
      vehicleQuery.value ?? '',
      authorizerQuery.value ?? '',
    ],
    query: ({ signal }) =>
      apiFetch<unknown>(PENDING_INVOICE_SUMMARY_PATH, {
        query: baseQuery.value,
        signal,
      }),
  });

  const summary = computed<DashboardBillingSummary>(() =>
    data.value != null
      ? mapDashboardBillingSummary(data.value)
      : EMPTY_DASHBOARD_BILLING_SUMMARY,
  );
  const isLoading = computed(() => asyncStatus.value === 'loading');
  const isError = computed(() => error.value != null);

  return {
    summary,
    isLoading,
    isError,
    refresh,
  };
}
