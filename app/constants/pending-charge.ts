import type {
  PendingChargeDropdownFilterId,
  PendingChargeOrderingField,
} from '~/constants/pending-charge-api';
import type { PendingChargeStatus } from '~/interfaces/invoicing/pending-charge';

export type PendingChargeColumnId =
  | 'cliente'
  | 'compania'
  | 'rfc'
  | 'responsable'
  | 'fecha_factura'
  | 'vencimiento'
  | 'dias_vencidos'
  | 'status'
  | 'total';

export interface PendingChargeColumnMeta {
  id: PendingChargeColumnId;
  label: string;
  kind: 'text' | 'number' | 'money' | 'date';
  ordering?: PendingChargeOrderingField;
  dropdown?: PendingChargeDropdownFilterId;
}

export const PENDING_CHARGE_DETAIL_COLUMNS: PendingChargeColumnMeta[] = [
  {
    id: 'cliente',
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
  { id: 'rfc', label: 'RFC', kind: 'text', ordering: 'rfc' },
  {
    id: 'responsable',
    label: 'Responsable',
    kind: 'text',
    ordering: 'responsible_name',
  },
  {
    id: 'fecha_factura',
    label: 'Fecha factura',
    kind: 'date',
    ordering: 'invoice_date',
  },
  {
    id: 'vencimiento',
    label: 'Vencimiento',
    kind: 'date',
    ordering: 'due_date',
  },
  {
    id: 'dias_vencidos',
    label: 'Días vencidos',
    kind: 'number',
  },
  { id: 'status', label: 'Status', kind: 'text', ordering: 'status' },
  { id: 'total', label: 'Total c/IVA', kind: 'money', ordering: 'total' },
];

export const PENDING_CHARGE_STATUS_LABELS: Record<PendingChargeStatus, string> = {
  vencida: 'Vencida',
  por_vencer: 'Por vencer',
  bien: 'Al corriente',
  sin_credito: 'Sin crédito',
};

export const PENDING_CHARGE_STATUS_FILTER_OPTIONS: {
  value: PendingChargeStatus;
  label: string;
}[] = [
  { value: 'vencida', label: PENDING_CHARGE_STATUS_LABELS.vencida },
  { value: 'por_vencer', label: PENDING_CHARGE_STATUS_LABELS.por_vencer },
  { value: 'bien', label: PENDING_CHARGE_STATUS_LABELS.bien },
  { value: 'sin_credito', label: PENDING_CHARGE_STATUS_LABELS.sin_credito },
];

export const PENDING_CHARGE_SEARCH_PLACEHOLDER =
  'Buscar cliente, compañía, RFC, responsable…';
