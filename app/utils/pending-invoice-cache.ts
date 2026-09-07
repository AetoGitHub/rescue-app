import type { QueryCache } from '@pinia/colada';
import {
  PENDING_INVOICE_BY_RESPONSIBLE_QUERY_KEY,
  PENDING_INVOICE_COMPANY_MATRIX_QUERY_KEY,
  PENDING_INVOICE_LIST_QUERY_KEY,
  PENDING_INVOICE_SUMMARY_QUERY_KEY,
} from '~/constants/pending-invoice-api';

export async function invalidatePendingInvoiceCaches(queryCache: QueryCache) {
  await queryCache.invalidateQueries({ key: [PENDING_INVOICE_LIST_QUERY_KEY] });
  await queryCache.invalidateQueries({
    key: [PENDING_INVOICE_SUMMARY_QUERY_KEY],
  });
  await queryCache.invalidateQueries({
    key: [PENDING_INVOICE_BY_RESPONSIBLE_QUERY_KEY],
  });
  await queryCache.invalidateQueries({
    key: [PENDING_INVOICE_COMPANY_MATRIX_QUERY_KEY],
  });
}
