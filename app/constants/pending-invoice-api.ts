import type {
  PendingInvoiceAttentionFilter,
  PendingInvoiceStatusFilter,
} from '~/interfaces/invoicing/pending-invoice-filters';

export const PENDING_INVOICE_API_PATHS = {
  summary: '/api/invoicing/pending_invoice/summary/',
  detail: '/api/invoicing/pending_invoice/detail/',
  bySeller: '/api/invoicing/pending_invoice/by_seller/',
  companyMatrix: '/api/invoicing/pending_invoice/company_matrix/',
} as const;

export const PENDING_INVOICE_ZIP_COMING_SOON = 'Próximamente';

export const PENDING_INVOICE_STATUS_OPTIONS: {
  label: string;
  value: PendingInvoiceStatusFilter | null;
}[] = [
  { label: 'Todos los estatus', value: null },
  { label: 'Sin atender', value: 'unattended' },
  { label: 'En remisión', value: 'in_remittance' },
];

export const PENDING_INVOICE_ATTENTION_OPTIONS: {
  label: string;
  value: PendingInvoiceAttentionFilter | null;
}[] = [
  { label: 'Atención: todos', value: null },
  { label: 'Necesita atención', value: 'needs_attention' },
];

export const PENDING_INVOICE_MONTH_OPTIONS: {
  label: string;
  value: number | null;
}[] = [
  { label: 'Todos los meses', value: null },
  ...Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const date = new Date(2026, index, 1);
    return {
      label: date.toLocaleDateString('es-MX', { month: 'long' }),
      value: month,
    };
  }),
];

const currentYear = new Date().getFullYear();

export const PENDING_INVOICE_YEAR_OPTIONS: {
  label: string;
  value: number | null;
}[] = [
  { label: 'Todos los años', value: null },
  ...Array.from({ length: 6 }, (_, index) => {
    const year = currentYear - index;
    return { label: String(year), value: year };
  }),
];

export const PENDING_INVOICE_MATRIX_WINDOW_OPTIONS = [
  { label: 'Últimos 3 meses', value: 3 },
  { label: 'Últimos 6 meses', value: 6 },
  { label: 'Últimos 12 meses', value: 12 },
] as const;

export type PendingInvoiceTabValue = 'detail' | 'seller' | 'matrix';

export const PENDING_INVOICE_TAB_ITEMS = [
  {
    label: 'Detalle',
    value: 'detail' as const,
    icon: 'i-lucide-list',
    slot: 'detail' as const,
  },
  {
    label: 'Por Responsable AETO',
    value: 'seller' as const,
    icon: 'i-lucide-user-check',
    slot: 'seller' as const,
  },
  {
    label: 'Matriz por Compañía',
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

/** @deprecated use PENDING_INVOICE_STATUS_OPTIONS */
export const PENDING_INVOICE_ESTATUS_OPTIONS = PENDING_INVOICE_STATUS_OPTIONS;

/** @deprecated use PENDING_INVOICE_ATTENTION_OPTIONS */
export const PENDING_INVOICE_ATENCION_OPTIONS = PENDING_INVOICE_ATTENTION_OPTIONS;

/** @deprecated use PENDING_INVOICE_MONTH_OPTIONS */
export const PENDING_INVOICE_MES_OPTIONS = PENDING_INVOICE_MONTH_OPTIONS;
