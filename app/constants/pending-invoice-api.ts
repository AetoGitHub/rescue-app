export const PENDING_INVOICE_LIST_PATH = '/api/dashboard/pending_invoice/';

export const PENDING_INVOICE_BY_RESPONSIBLE_PATH =
  '/api/dashboard/by_responsible/';

export const PENDING_INVOICE_COMPANY_MATRIX_PATH =
  '/api/dashboard/company_matrix/';

/** Backend default when `admin_status` is omitted; sent explicitly for clarity. */
export const PENDING_INVOICE_DEFAULT_ADMIN_STATUS =
  'unattended,in_remittance' as const;

export const PENDING_INVOICE_LIST_QUERY_KEY = 'pending-invoice-list' as const;

export const PENDING_INVOICE_BY_RESPONSIBLE_QUERY_KEY =
  'pending-invoice-by-responsible' as const;

export const PENDING_INVOICE_COMPANY_MATRIX_QUERY_KEY =
  'pending-invoice-company-matrix' as const;

export const PENDING_INVOICE_COMPANY_DROPDOWN_PATH =
  '/api/catalogue/company/dropdown/' as const;
