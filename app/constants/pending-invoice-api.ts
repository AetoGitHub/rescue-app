export const PENDING_INVOICE_LIST_PATH = '/api/dashboard/pending_invoice/';

/** Backend default when `admin_status` is omitted; sent explicitly for clarity. */
export const PENDING_INVOICE_DEFAULT_ADMIN_STATUS =
  'unattended,in_remittance' as const;

export const PENDING_INVOICE_LIST_QUERY_KEY = 'pending-invoice-list' as const;
