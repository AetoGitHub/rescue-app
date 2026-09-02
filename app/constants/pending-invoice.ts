import type {
  PendingInvoiceDropdownFilterId,
  PendingInvoiceOrderingField,
} from '~/constants/pending-invoice-api';

export type PendingInvoiceTabValue = 'detail' | 'seller' | 'matrix';

export const PENDING_INVOICE_TAB_ITEMS = [
  {
    label: 'Detalle',
    value: 'detail' as const,
    icon: 'i-lucide-table-2',
    slot: 'detail' as const,
  },
  {
    label: 'Por Responsable AETO',
    value: 'seller' as const,
    icon: 'i-lucide-user-check',
    slot: 'seller' as const,
  },
  {
    label: 'Matriz por Compañía ($ y #)',
    value: 'matrix' as const,
    icon: 'i-lucide-grid-3x3',
    slot: 'matrix' as const,
  },
] as const;

export function isPendingInvoiceTabValue(
  value: string | null | undefined,
): value is PendingInvoiceTabValue {
  return value === 'detail' || value === 'seller' || value === 'matrix';
}

export const PENDING_INVOICE_MATRIX_WINDOW_OPTIONS = [
  { label: 'Últimos 3 meses', value: 3 },
  { label: 'Últimos 6 meses', value: 6 },
  { label: 'Últimos 12 meses', value: 12 },
  { label: 'Últimos 18 meses', value: 18 },
] as const;

export type PendingInvoiceMatrixMonths =
  (typeof PENDING_INVOICE_MATRIX_WINDOW_OPTIONS)[number]['value'];

export const PENDING_INVOICE_DEFAULT_MATRIX_MONTHS: PendingInvoiceMatrixMonths = 6;

export type PendingInvoiceColumnId =
  | 'oc_pdf'
  | 'factura'
  | 'folio'
  | 'compania_grupo'
  | 'compania'
  | 'responsable'
  | 'unidad'
  | 'autorizador'
  | 'mes'
  | 'fecha'
  | 'dias'
  | 'status'
  | 'descripcion'
  | 'purchase_order'
  | 'costo_tecnico'
  | 'subtotal'
  | 'iva'
  | 'total'
  | 'evidencia_rescate'
  | 'evidencia_pagos';

export interface PendingInvoiceColumnMeta {
  id: PendingInvoiceColumnId;
  label: string;
  /** Numeric and date columns sort by value and align right. */
  kind: 'text' | 'number' | 'money' | 'date' | 'flag';
  /** API `ordering` field. Prefix `-` is applied for descending. */
  ordering?: PendingInvoiceOrderingField;
  /**
   * When set, the Excel header filter loads options from the matching
   * pending-invoice dropdown endpoint and sends ids as a comma-separated QP.
   */
  dropdown?: PendingInvoiceDropdownFilterId;
  /**
   * `dias` is the inverse of `date` (more days = older). When true, the
   * descending UI flag is flipped before sending `ordering`.
   */
  invertOrdering?: boolean;
}

export const PENDING_INVOICE_DETAIL_COLUMNS: PendingInvoiceColumnMeta[] = [
  { id: 'oc_pdf', label: 'PDF OC', kind: 'flag' },
  { id: 'factura', label: 'Factura', kind: 'text' },
  { id: 'folio', label: 'Folio', kind: 'text', ordering: 'folio' },
  {
    id: 'compania_grupo',
    label: 'Cliente',
    kind: 'text',
    ordering: 'client_name',
    dropdown: 'client',
  },
  {
    id: 'compania',
    label: 'Compañía',
    kind: 'text',
    ordering: 'company_name',
    dropdown: 'company',
  },
  {
    id: 'responsable',
    label: 'Responsable',
    kind: 'text',
    ordering: 'operator_name',
    dropdown: 'operator',
  },
  {
    id: 'unidad',
    label: 'Unidad',
    kind: 'text',
    ordering: 'vehicle',
    dropdown: 'vehicle',
  },
  {
    id: 'autorizador',
    label: 'Autorizador',
    kind: 'text',
    ordering: 'authorizer',
    dropdown: 'authorizer',
  },
  { id: 'mes', label: 'Mes', kind: 'text', ordering: 'date' },
  { id: 'fecha', label: 'Fecha', kind: 'date', ordering: 'date' },
  {
    id: 'dias',
    label: 'Días',
    kind: 'number',
    ordering: 'date',
    invertOrdering: true,
  },
  { id: 'status', label: 'Status', kind: 'text', ordering: 'admin_status' },
  {
    id: 'descripcion',
    label: 'Descripción',
    kind: 'text',
    ordering: 'service_description',
  },
  {
    id: 'purchase_order',
    label: 'OC',
    kind: 'text',
    ordering: 'purchase_order',
  },
  {
    id: 'costo_tecnico',
    label: 'Costo técnico',
    kind: 'money',
    ordering: 'technical_cost',
  },
  { id: 'subtotal', label: 'Subtotal', kind: 'money', ordering: 'sub_total' },
  { id: 'iva', label: 'IVA', kind: 'money', ordering: 'iva' },
  { id: 'total', label: 'Total c/IVA', kind: 'money', ordering: 'total' },
  { id: 'evidencia_rescate', label: 'Evid. rescate', kind: 'flag' },
  { id: 'evidencia_pagos', label: 'Evid. pagos', kind: 'flag' },
];

/**
 * Spreadsheet look shared by the summary tables: teal header band plus visible
 * gridlines between cells.
 */
export const pendingInvoiceExcelTableUi = {
  root: 'min-h-0 flex-1 overflow-auto rounded-lg border border-muted bg-default',
  // Scoped to thead because UTable renders footer cells as `th` too.
  thead:
    '[&>tr>th]:bg-sheet-header [&>tr>th]:text-sheet-header-foreground',
  th: 'px-2.5 py-2',
  td: 'border-e border-default last:border-e-0 px-2.5 py-1.5 text-sm',
  tfoot: [
    'bg-elevated/60',
    '[&>tr>th]:border-e [&>tr>th]:border-default [&>tr>th:last-child]:border-e-0',
    '[&>tr>th]:text-sm [&>tr>th]:normal-case [&>tr>th]:tracking-normal [&>tr>th]:text-default',
  ].join(' '),
} as const;

export const pendingInvoiceExcelHeaderCellClass =
  'bg-sheet-header px-2.5 py-2 text-sheet-header-foreground';

export const pendingInvoiceExcelCellClass =
  'border-e border-default last:border-e-0';

export const PENDING_INVOICE_SEARCH_PLACEHOLDER =
  'Buscar folio, compañía, cliente, unidad, autorizador…';

export const PENDING_INVOICE_ADMIN_DOC_COPY = {
  upload: 'Subir',
  uploadReplace: 'Editar documentos',
  ocPdfOpen: 'Abrir PDF de la orden de compra',
} as const;

export const PENDING_INVOICE_ZIP_TOAST = {
  title: 'Descarga simulada',
  description:
    'En producción genera un .xlsx por compañía (hojas Detalle y Matriz) más _CONSOLIDADO.xlsx con lo filtrado.',
} as const;
