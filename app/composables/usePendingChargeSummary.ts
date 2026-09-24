import { useQuery } from '@pinia/colada';
import {
  PENDING_CHARGE_CLIENT_SUMMARY_PATH,
  PENDING_CHARGE_SUMMARY_PATH,
  PENDING_CHARGE_SUMMARY_QUERY_KEY,
} from '~/constants/pending-charge-api';
import type { DashboardBillingSummary } from '~/interfaces/invoicing/dashboard-summary';
import type { PaginatedQueryValue } from '~/utils/catalog-pagination';

/**
 * Sibling of `GET /api/dashboard/pending_charge/`:
 * `GET /api/dashboard/pending_charge/summary/`.
 *
 * Reuses the same filters as `usePendingChargeList`.
 * En el portal de cliente usa `/api/client/pending_charge/summary/` y manda
 * el mismo `?clients=` que el listado.
 */
export function usePendingChargeSummary() {
  const apiFetch = useApiFetch();
  const { companyQuery, clientQuery, statusQuery, clientsQuery } =
    usePendingChargeList();
  const reportScope = usePendingReportScope();

  const summaryPath = computed(() =>
    reportScope.value === 'client'
      ? PENDING_CHARGE_CLIENT_SUMMARY_PATH
      : PENDING_CHARGE_SUMMARY_PATH,
  );

  const baseQuery = computed(() => {
    const query: Record<string, PaginatedQueryValue> = {};
    if (companyQuery.value != null) query.company = companyQuery.value;
    if (clientQuery.value != null) query.client = clientQuery.value;
    if (statusQuery.value != null) query.status = statusQuery.value;
    if (clientsQuery.value != null) query.clients = clientsQuery.value;
    return query;
  });

  const { data, asyncStatus, error, refresh } = useQuery({
    key: () => [
      PENDING_CHARGE_SUMMARY_QUERY_KEY,
      reportScope.value,
      companyQuery.value ?? '',
      clientQuery.value ?? '',
      statusQuery.value ?? '',
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
