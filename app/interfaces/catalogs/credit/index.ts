export interface CreditCreateBody {
  client: number;
  limit: string;
  days: number;
  extension: number;
  remision_tolerance: number;
  requires_purchase_order: boolean;
  is_blocked: boolean;
}

export type CreditFormState = Omit<CreditCreateBody, 'client'>;

export interface CreditInfoBucket {
  amount: number;
  count: number;
}

export interface CreditDetail {
  id: number;
  client_id: number;
  limit: string;
  days: number;
  extension: number;
  remision_tolerance: number;
  requires_purchase_order: boolean;
  is_blocked: boolean;
  is_active: boolean;
  created_at?: string;
  credit_used: string;
  credit_available: number;
  credit_info?: {
    overdue: CreditInfoBucket;
    upcoming: CreditInfoBucket;
  };
}

/** Read-only credit metrics for UI (list + credit tab). */
export interface ClientCreditSummary {
  credit_id?: number | null;
  credit_limit: string | null;
  credit_used: string | null;
  credit_available: number | null;
  overdue_amount?: string | number | null;
  overdue_invoices_count?: number;
  due_soon_amount?: string | number | null;
  due_soon_invoices_count?: number;
}

/** Pending invoice row from GET /api/credit/client/{id}/invoices/ */
export interface ClientCreditInvoice {
  id: number;
  folio?: string;
  amount?: string | number;
  billed_at?: string;
  days_overdue?: number;
  status?: string;
}
