import type {
  PendingChargeRow,
  PendingChargeStatus,
  PendingChargeSummary,
} from '~/interfaces/invoicing/pending-charge';
import type { PendingChargeColumnId } from '~/constants/pending-charge';
import { PENDING_CHARGE_STATUS_LABELS } from '~/constants/pending-charge';

export type PendingChargeColumnFilters = Partial<
  Record<PendingChargeColumnId, string[]>
>;

export interface PendingChargeFilterInput {
  search?: string;
  columnFilters?: PendingChargeColumnFilters;
  statuses?: PendingChargeStatus[];
}

export interface PendingChargeCell {
  value: string;
  label: string;
}

export function pendingChargeCell(
  row: PendingChargeRow,
  columnId: PendingChargeColumnId,
): PendingChargeCell {
  switch (columnId) {
    case 'fecha_factura':
      return {
        value: row.fecha_factura,
        label: formatPendingInvoiceDateShort(row.fecha_factura),
      };
    case 'vencimiento':
      return {
        value: row.vencimiento,
        label: formatPendingInvoiceDateShort(row.vencimiento),
      };
    case 'dias_vencidos':
      return {
        value: String(row.dias_vencidos),
        label: `${row.dias_vencidos} días`,
      };
    case 'total':
      return {
        value: String(row.total),
        label: formatPendingInvoiceMoney(row.total),
      };
    case 'status':
      return {
        value: row.status,
        label: PENDING_CHARGE_STATUS_LABELS[row.status],
      };
    default: {
      const raw = row[columnId];
      const text = typeof raw === 'string' && raw.trim() ? raw : '—';
      return { value: text, label: text };
    }
  }
}

const SEARCHABLE_KEYS: PendingChargeColumnId[] = [
  'cliente',
  'compania',
  'rfc',
  'responsable',
];

function matchesSearch(row: PendingChargeRow, term: string): boolean {
  const needle = term.trim().toLowerCase();
  if (!needle) return true;

  const haystack = [
    ...SEARCHABLE_KEYS.map(key => row[key] as string),
    PENDING_CHARGE_STATUS_LABELS[row.status],
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(needle);
}

export function filterPendingChargeRows(
  rows: PendingChargeRow[],
  input: PendingChargeFilterInput = {},
): PendingChargeRow[] {
  const { search = '', columnFilters = {}, statuses } = input;
  const statusSet = statuses?.length ? new Set(statuses) : null;

  const activeColumns = Object.entries(columnFilters).filter(
    ([key, values]) =>
      key !== 'status'
      && Array.isArray(values)
      && values.length > 0,
  ) as [PendingChargeColumnId, string[]][];

  return rows.filter(row => {
    if (statusSet != null && !statusSet.has(row.status)) return false;
    if (!matchesSearch(row, search)) return false;

    return activeColumns.every(([columnId, values]) =>
      values.includes(pendingChargeCell(row, columnId).value),
    );
  });
}

function sortValueOf(
  row: PendingChargeRow,
  columnId: PendingChargeColumnId,
): number | string {
  switch (columnId) {
    case 'dias_vencidos':
      return row.dias_vencidos;
    case 'total':
      return row.total;
    case 'fecha_factura':
      return parsePendingInvoiceDate(row.fecha_factura)?.getTime() ?? 0;
    case 'vencimiento':
      return parsePendingInvoiceDate(row.vencimiento)?.getTime() ?? 0;
    case 'status':
      return PENDING_CHARGE_STATUS_LABELS[row.status];
    default:
      return pendingChargeCell(row, columnId).value;
  }
}

export function sortPendingChargeRows(
  rows: PendingChargeRow[],
  columnId: PendingChargeColumnId | null,
  descending: boolean,
): PendingChargeRow[] {
  if (columnId == null) return rows;

  return [...rows].sort((a, b) => {
    const left = sortValueOf(a, columnId);
    const right = sortValueOf(b, columnId);
    const direction = descending ? -1 : 1;

    if (typeof left === 'number' && typeof right === 'number') {
      return (left - right) * direction;
    }

    return String(left).localeCompare(String(right), 'es-MX') * direction;
  });
}

export function pendingChargeColumnOptions(
  rows: PendingChargeRow[],
  columnId: PendingChargeColumnId,
): PendingChargeCell[] {
  const seen = new Map<string, string>();

  for (const row of rows) {
    const cell = pendingChargeCell(row, columnId);
    if (!seen.has(cell.value)) seen.set(cell.value, cell.label);
  }

  const options = [...seen].map(([value, label]) => ({ value, label }));
  const numeric = columnId === 'dias_vencidos'
    || columnId === 'fecha_factura'
    || columnId === 'vencimiento';

  return options.sort((a, b) =>
    numeric
      ? Number(b.value.replaceAll('-', '')) - Number(a.value.replaceAll('-', ''))
      : a.label.localeCompare(b.label, 'es-MX'),
  );
}

export function summarizePendingChargeRows(
  rows: PendingChargeRow[],
): PendingChargeSummary {
  return rows.reduce<PendingChargeSummary>(
    (accumulator, row) => ({
      clientes: accumulator.clientes + 1,
      total: accumulator.total + row.total,
    }),
    { clientes: 0, total: 0 },
  );
}
