export type PendingInvoiceStatus = 'Sin atender' | 'En remisión';

export type PendingInvoiceAdminStatus =
  | 'invalid'
  | 'unattended'
  | 'in_remittance'
  | 'invoiced'
  | 'paid'
  | 'canceled'
  | 'warranty';

export type PendingInvoiceDaysPromColor = 'verde' | 'amarillo' | 'rojo';

/** Shared multi-select filter (dropdown id + label). */
export interface PendingInvoiceFilterSelection {
  id: number;
  name: string;
}

/** @deprecated Use PendingInvoiceFilterSelection. */
export type PendingInvoiceCompanySelection = PendingInvoiceFilterSelection;

/** Raw row from `GET /api/dashboard/pending_invoice/`. */
export interface PendingInvoiceApiRow {
  id: number;
  folio: string;
  company_name: string | null;
  client_name: string;
  operator_name: string | null;
  date: string;
  vehicle: string | null;
  authorizer: string | null;
  service_description: string;
  sub_total: string | number;
  iva: string | number;
  total: string | number;
  technical_cost: string | number;
  admin_status?: PendingInvoiceAdminStatus | string | null;
  purchase_order?: string | null;
  oc_pdf?: string | null;
  invoice_folio?: string | null;
  invoice_number?: string | null;
  factura?: string | null;
  /** Legacy aliases still accepted while older payloads exist. */
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
  oc_pdf: string | null;
  /** Mapped from `invoice_folio` (admin_doc / pending invoice). */
  factura: string | null;
}

export interface PendingInvoiceSummary {
  eventos: number;
  subtotal: number;
  iva: number;
  total: number;
}

/** Raw row from `GET /api/dashboard/by_responsible/`. */
export interface PendingInvoiceByResponsibleApiRow {
  id: number;
  responsible_name: string;
  eventos: number | null;
  sin_atender: number | null;
  remision: number | null;
  atencion: number | null;
  dias_prom: number | null;
  dias_prom_color: PendingInvoiceDaysPromColor | string | null;
  dias_maximo: number | null;
  subtotal: string | number | null;
  iva: string | number | null;
  total: string | number | null;
  porcentaje_facturado: number | null;
}

export interface PendingInvoiceSellerRow {
  id: number;
  responsable: string;
  eventos: number;
  sin_atender: number;
  remision: number;
  atencion: number;
  subtotal: number;
  iva: number;
  total: number;
  porcentaje_facturado: number;
}

export interface PendingInvoiceMatrixCell {
  monto: number;
  eventos: number;
}

/** Raw month cell from `GET /api/dashboard/company_matrix/`. */
export interface PendingInvoiceCompanyMatrixApiCell {
  total?: string | number | null;
  eventos?: number | null;
}

/** Raw row from `GET /api/dashboard/company_matrix/`. */
export interface PendingInvoiceCompanyMatrixApiRow {
  client_id: number;
  client_name: string;
  responsible_name?: string | null;
  meses: Record<string, PendingInvoiceCompanyMatrixApiCell>;
  total?: string | number | null;
}

export interface PendingInvoiceMatrixRow {
  row_key: string;
  client_id: number | null;
  cliente: string;
  responsable: string;
  meses: Record<string, PendingInvoiceMatrixCell>;
  total: number;
  eventos: number;
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
