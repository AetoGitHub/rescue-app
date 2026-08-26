/** API `status` from `GET /api/dashboard/pending_charge/`. */
export type PendingChargeApiStatus = 'vencida' | 'por_vencer' | 'bien';

export type PendingChargeStatus = PendingChargeApiStatus | 'sin_credito';

/** Shared multi-select filter (dropdown id + label). */
export interface PendingChargeFilterSelection {
  id: number;
  name: string;
}

/** Raw row from `GET /api/dashboard/pending_charge/`. */
export interface PendingChargeApiRow {
  id: number;
  company_name: string | null;
  client_name: string;
  rfc: string | null;
  responsible_name: string | null;
  invoice_date: string | null;
  due_date: string | null;
  days_overdue: number | string | null;
  status: PendingChargeApiStatus | string | null;
  total: string | number;
}

export interface PendingChargeRow {
  id: number;
  cliente: string;
  compania: string;
  rfc: string;
  responsable: string;
  fecha_factura: string;
  vencimiento: string;
  dias_vencidos: number;
  status: PendingChargeStatus;
  total: number;
}

export interface PendingChargeSummary {
  clientes: number;
  total: number;
}
