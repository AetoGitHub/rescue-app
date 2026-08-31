export const PENDING_CHARGE_LIST_PATH = '/api/dashboard/pending_charge/';

export const PENDING_CHARGE_SUMMARY_PATH =
  '/api/dashboard/pending_charge/summary/';

export const PENDING_CHARGE_LIST_QUERY_KEY = 'pending-charge-list' as const;

export const PENDING_CHARGE_SUMMARY_QUERY_KEY =
  'pending-charge-summary' as const;

export const PENDING_CHARGE_COMPANIES_DROPDOWN_PATH =
  '/api/dashboard/pending_charge/companies/dropdown/' as const;

export const PENDING_CHARGE_CLIENTS_DROPDOWN_PATH =
  '/api/dashboard/pending_charge/clients/dropdown/' as const;

export const PENDING_CHARGE_DROPDOWN_PATHS = {
  company: PENDING_CHARGE_COMPANIES_DROPDOWN_PATH,
  client: PENDING_CHARGE_CLIENTS_DROPDOWN_PATH,
} as const;

export type PendingChargeDropdownFilterId =
  keyof typeof PENDING_CHARGE_DROPDOWN_PATHS;

/** Backend-valid `?ordering=` fields. `days_overdue` is display-only. */
export const PENDING_CHARGE_ORDERING_FIELDS = [
  'id',
  'company_name',
  'client_name',
  'rfc',
  'responsible_name',
  'invoice_date',
  'due_date',
  'status',
  'total',
] as const;

export type PendingChargeOrderingField =
  (typeof PENDING_CHARGE_ORDERING_FIELDS)[number];
