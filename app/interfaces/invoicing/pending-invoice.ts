export type PendingInvoiceStatus = 'Sin atender' | 'En remisión';

export type PendingInvoiceAdminStatus =
  | 'invalid'
  | 'unattended'
  | 'in_remittance'
  | 'invoiced'
  | 'paid'
  | 'canceled'
  | 'warranty';

/** Raw row from `GET /api/dashboard/pending_invoice/`. */
export interface PendingInvoiceApiRow {
  id: number;
  folio: string;
  company_name: string;
  client_name: string;
  operator_name: string;
  date: string;
  vehicle: string | null;
  authorizer: string;
  service_description: string;
  sub_total: string | number;
  iva: string | number;
  total: string | number;
  technical_cost: string | number;
  /** Present when the backend starts sending it. */
  admin_status?: PendingInvoiceAdminStatus | string | null;
  oc?: string | null;
  purchase_order_number?: string | null;
  has_service_evidence?: boolean | null;
  has_payment_evidence?: boolean | null;
}

export interface PendingInvoiceRow {
  id: number;
  folio: string;
  /** Mapped from `client_name` (shown as Cliente). */
  compania_grupo: string;
  /** Mapped from `company_name` (company filter + matrix). */
  compania: string;
  responsable: string;
  unidad: string;
  autorizador: string;
  /** Short month label, e.g. `Feb`. */
  mes: string;
  /** Sortable month key, e.g. `2026-02`. */
  mes_key: string;
  fecha: string;
  dias: number;
  status: PendingInvoiceStatus;
  descripcion: string;
  costo_tecnico: number;
  subtotal: number;
  iva: number;
  total: number;
  evidencia_rescate: boolean;
  evidencia_pagos: boolean;
  oc: string | null;
}

export interface PendingInvoiceSummary {
  eventos: number;
  subtotal: number;
  iva: number;
  total: number;
}

export interface PendingInvoiceSellerRow {
  responsable: string;
  eventos: number;
  sin_atender: number;
  remision: number;
  atencion: number;
  dias_prom: number;
  dias_max: number;
  subtotal: number;
  iva: number;
  total: number;
}

export interface PendingInvoiceMatrixCell {
  monto: number;
  eventos: number;
}

export interface PendingInvoiceMatrixAuthorizerRow {
  autorizador: string;
  meses: Record<string, PendingInvoiceMatrixCell>;
  total: number;
  eventos: number;
}

export interface PendingInvoiceMatrixRow {
  compania: string;
  meses: Record<string, PendingInvoiceMatrixCell>;
  total: number;
  eventos: number;
  autorizadores: PendingInvoiceMatrixAuthorizerRow[];
}

export interface PendingInvoiceMatrix {
  month_keys: string[];
  rows: PendingInvoiceMatrixRow[];
  totals: {
    meses: Record<string, PendingInvoiceMatrixCell>;
    total: number;
    eventos: number;
  };
}
