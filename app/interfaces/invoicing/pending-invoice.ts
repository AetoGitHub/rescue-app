export interface PendingInvoiceSparklinePoint {
  fecha: string;
  valor: number;
}

export interface PendingInvoiceSummary {
  total_con_iva: number;
  subtotal: number;
  eventos: number;
  sparkline_14d: {
    total_con_iva: PendingInvoiceSparklinePoint[];
    subtotal: PendingInvoiceSparklinePoint[];
    eventos: PendingInvoiceSparklinePoint[];
  };
}

export interface PendingInvoiceDetailRow {
  id: number;
  folio: string;
  compania_grupo: string;
  compania: string;
  responsable: string;
  unidad: string;
  autorizador: string;
  mes: string;
  fecha: string;
  dias: number;
  status: string;
  descripcion: string | null;
  subtotal: string;
  iva: number;
  total: string;
  tiene_evidencia: boolean;
  tiene_cotizacion: boolean;
  oc: string | null;
}

export interface PendingInvoiceBySellerRow {
  responsable_id: number;
  responsable_nombre: string;
  total: number;
  eventos: number;
  dias_max: number;
}

export interface PendingInvoiceMatrixMonthCell {
  monto: number;
  eventos: number;
}

export interface PendingInvoiceCompanyMatrixRow {
  compania: string;
  responsable?: string | null;
  meses: Record<string, PendingInvoiceMatrixMonthCell>;
  total: number;
  dias_max: number;
}
