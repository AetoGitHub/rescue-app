import { useQuery } from '@pinia/colada';
import type { MaybeRefOrGetter } from 'vue';
import {
  PENDING_INVOICE_COMPANY_MATRIX_PATH,
  PENDING_INVOICE_COMPANY_MATRIX_QUERY_KEY,
} from '~/constants/pending-invoice-api';
import type { PendingInvoiceCompanyMatrixApiRow } from '~/interfaces/invoicing/pending-invoice';
import type { PaginatedQueryValue } from '~/utils/catalog-pagination';
import { mapPendingInvoiceCompanyMatrix } from '~/utils/pending-invoice-dashboard-map';

/**
 * Company × month matrix from `/api/dashboard/company_matrix/?months=N`.
 */
export function usePendingInvoiceCompanyMatrix(
  months: MaybeRefOrGetter<number>,
) {
  const apiFetch = useApiFetch();
  const { companyQuery, startDateQuery, endDateQuery } = usePendingInvoiceList();
  const monthsValue = computed(() => toValue(months));

  const {
    data,
    asyncStatus,
    error,
    refresh,
  } = useQuery({
    key: () => [
      PENDING_INVOICE_COMPANY_MATRIX_QUERY_KEY,
      String(monthsValue.value),
      serializeCompanyQuery(companyQuery.value),
      startDateQuery.value ?? '',
      endDateQuery.value ?? '',
    ],
    query: () => {
      const query: Record<string, PaginatedQueryValue> = {
        months: String(monthsValue.value),
      };
      if (companyQuery.value != null) query.company = companyQuery.value;
      if (startDateQuery.value != null) query.start_date = startDateQuery.value;
      if (endDateQuery.value != null) query.end_date = endDateQuery.value;
      return apiFetch<PendingInvoiceCompanyMatrixApiRow[]>(
        PENDING_INVOICE_COMPANY_MATRIX_PATH,
        { query },
      );
    },
  });

  const matrix = computed(() =>
    mapPendingInvoiceCompanyMatrix(
      data.value ?? [],
      monthsValue.value,
    ),
  );

  const isInitialLoading = computed(
    () =>
      asyncStatus.value === 'loading' &&
      data.value == null &&
      error.value == null,
  );
  const isError = computed(() => error.value != null);
  const errorMessage = computed(() =>
    error.value != null ? getFetchErrorMessage(error.value) : '',
  );

  return {
    matrix,
    isInitialLoading,
    isError,
    errorMessage,
    refresh,
  };
}

function serializeCompanyQuery(
  value: string | string[] | undefined,
): string {
  if (value == null) return '';
  return Array.isArray(value) ? value.join(',') : value;
}
