import { useQuery } from '@pinia/colada';
import {
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
 */
export function usePendingChargeSummary() {
  const apiFetch = useApiFetch();
  const { companyQuery, clientQuery, statusQuery } = usePendingChargeList();

  const baseQuery = computed(() => {
    const query: Record<string, PaginatedQueryValue> = {};
    if (companyQuery.value != null) query.company = companyQuery.value;
    if (clientQuery.value != null) query.client = clientQuery.value;
    if (statusQuery.value != null) query.status = statusQuery.value;
    return query;
  });

  const { data, asyncStatus, error, refresh } = useQuery({
    key: () => [
      PENDING_CHARGE_SUMMARY_QUERY_KEY,
      companyQuery.value ?? '',
      clientQuery.value ?? '',
      statusQuery.value ?? '',
    ],
    query: ({ signal }) =>
      apiFetch<unknown>(PENDING_CHARGE_SUMMARY_PATH, {
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
