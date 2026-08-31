export const PENDING_INVOICE_LIST_PATH = '/api/dashboard/pending_invoice/';

export const PENDING_INVOICE_SUMMARY_PATH =
  '/api/dashboard/pending_invoice/summary/';

export const PENDING_INVOICE_BY_RESPONSIBLE_PATH =
  '/api/dashboard/by_responsible/';

export const PENDING_INVOICE_COMPANY_MATRIX_PATH =
  '/api/dashboard/company_matrix/';

/** Backend default when `admin_status` is omitted; sent explicitly for clarity. */
export const PENDING_INVOICE_DEFAULT_ADMIN_STATUS =
  'unattended,in_remittance' as const;

export const PENDING_INVOICE_LIST_QUERY_KEY = 'pending-invoice-list' as const;

export const PENDING_INVOICE_SUMMARY_QUERY_KEY =
  'pending-invoice-summary' as const;

export const PENDING_INVOICE_BY_RESPONSIBLE_QUERY_KEY =
  'pending-invoice-by-responsible' as const;

export const PENDING_INVOICE_COMPANY_MATRIX_QUERY_KEY =
  'pending-invoice-company-matrix' as const;

export const PENDING_INVOICE_COMPANIES_DROPDOWN_PATH =
  '/api/dashboard/pending_invoice/companies/dropdown/' as const;

export const PENDING_INVOICE_CLIENTS_DROPDOWN_PATH =
  '/api/dashboard/pending_invoice/clients/dropdown/' as const;

export const PENDING_INVOICE_OPERATORS_DROPDOWN_PATH =
  '/api/dashboard/pending_invoice/operators/dropdown/' as const;

export const PENDING_INVOICE_VEHICLES_DROPDOWN_PATH =
  '/api/dashboard/pending_invoice/vehicles/dropdown/' as const;

export const PENDING_INVOICE_AUTHORIZERS_DROPDOWN_PATH =
  '/api/dashboard/pending_invoice/authorizers/dropdown/' as const;

/** @deprecated Use PENDING_INVOICE_COMPANIES_DROPDOWN_PATH. */
export const PENDING_INVOICE_COMPANY_DROPDOWN_PATH =
  PENDING_INVOICE_COMPANIES_DROPDOWN_PATH;

export const PENDING_INVOICE_DROPDOWN_PATHS = {
  company: PENDING_INVOICE_COMPANIES_DROPDOWN_PATH,
  client: PENDING_INVOICE_CLIENTS_DROPDOWN_PATH,
  operator: PENDING_INVOICE_OPERATORS_DROPDOWN_PATH,
  vehicle: PENDING_INVOICE_VEHICLES_DROPDOWN_PATH,
  authorizer: PENDING_INVOICE_AUTHORIZERS_DROPDOWN_PATH,
} as const;

export type PendingInvoiceDropdownFilterId =
  keyof typeof PENDING_INVOICE_DROPDOWN_PATHS;

export const PENDING_INVOICE_ORDERING_FIELDS = [
  'id',
  'folio',
  'admin_status',
  'company_name',
  'client_name',
  'operator_name',
  'date',
  'vehicle',
  'authorizer',
  'service_description',
  'purchase_order',
  'sub_total',
  'iva',
  'total',
  'technical_cost',
] as const;

export type PendingInvoiceOrderingField =
  (typeof PENDING_INVOICE_ORDERING_FIELDS)[number];

export const PENDING_INVOICE_DEFAULT_ORDERING = 'date' as const;
