import type {
  PendingInvoiceRow,
  PendingInvoiceSummary,
} from '~/interfaces/invoicing/pending-invoice';
import type { PendingInvoiceColumnId } from '~/constants/pending-invoice';
import {
  formatPendingInvoiceDateShort,
  formatPendingInvoiceMoney,
} from '~/utils/pending-invoice-display';

export type PendingInvoiceColumnFilters = Partial<
  Record<PendingInvoiceColumnId, string[]>
>;

export interface PendingInvoiceFilterInput {
  companies?: string[];
  search?: string;
  columnFilters?: PendingInvoiceColumnFilters;
}

export interface PendingInvoiceCell {
  value: string;
  label: string;
}

export function pendingInvoiceCell(
  row: PendingInvoiceRow,
  columnId: PendingInvoiceColumnId,
): PendingInvoiceCell {
  switch (columnId) {
    case 'fecha':
      return {
        value: row.fecha.slice(0, 10),
        label: formatPendingInvoiceDateShort(row.fecha),
      };
    case 'dias':
      return { value: String(row.dias), label: `${row.dias} días` };
    case 'costo_tecnico':
      return {
        value: String(row.costo_tecnico),
        label: formatPendingInvoiceMoney(row.costo_tecnico),
      };
    case 'subtotal':
      return {
        value: String(row.subtotal),
        label: formatPendingInvoiceMoney(row.subtotal),
      };
    case 'iva':
      return { value: String(row.iva), label: formatPendingInvoiceMoney(row.iva) };
    case 'total':
      return {
        value: String(row.total),
        label: formatPendingInvoiceMoney(row.total),
      };
    case 'evidencia_rescate':
      return {
        value: row.evidencia_rescate ? 'si' : 'no',
        label: row.evidencia_rescate
          ? 'Con evidencia de rescate'
          : 'Sin evidencia de rescate',
      };
    case 'evidencia_pagos':
      return {
        value: row.evidencia_pagos ? 'si' : 'no',
        label: row.evidencia_pagos
          ? 'Con evidencia de pagos'
          : 'Sin evidencia de pagos',
      };
    case 'mes':
      return { value: row.mes_key, label: `${row.mes} · ${row.mes_key}` };
    default: {
      const raw = row[columnId];
      const text = typeof raw === 'string' && raw.trim() ? raw : '—';
      return { value: text, label: text };
    }
  }
}

function sortValueOf(
  row: PendingInvoiceRow,
  columnId: PendingInvoiceColumnId,
): number | string {
  switch (columnId) {
    case 'dias':
      return row.dias;
    case 'costo_tecnico':
      return row.costo_tecnico;
    case 'subtotal':
      return row.subtotal;
    case 'iva':
      return row.iva;
    case 'total':
      return row.total;
    case 'fecha':
      return new Date(row.fecha).getTime();
    case 'mes':
      return row.mes_key;
    case 'evidencia_rescate':
      return row.evidencia_rescate ? 1 : 0;
    case 'evidencia_pagos':
      return row.evidencia_pagos ? 1 : 0;
    default:
      return pendingInvoiceCell(row, columnId).value;
  }
}

const SEARCHABLE_KEYS: PendingInvoiceColumnId[] = [
  'folio',
  'compania_grupo',
  'compania',
  'unidad',
  'autorizador',
  'responsable',
  'descripcion',
];

function matchesSearch(row: PendingInvoiceRow, term: string): boolean {
  const needle = term.trim().toLowerCase();
  if (!needle) return true;

  const haystack = [
    ...SEARCHABLE_KEYS.map(key => row[key] as string),
    row.oc ?? '',
    row.status,
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(needle);
}

export function filterPendingInvoiceRows(
  rows: PendingInvoiceRow[],
  input: PendingInvoiceFilterInput = {},
): PendingInvoiceRow[] {
  const { companies, search = '', columnFilters = {} } = input;
  const companySet = companies?.length ? new Set(companies) : null;

  const activeColumns = Object.entries(columnFilters).filter(
    ([, values]) => Array.isArray(values) && values.length > 0,
  ) as [PendingInvoiceColumnId, string[]][];

  return rows.filter(row => {
    if (companySet != null && !companySet.has(row.compania)) return false;
    if (!matchesSearch(row, search)) return false;

    return activeColumns.every(([columnId, values]) =>
      values.includes(pendingInvoiceCell(row, columnId).value),
    );
  });
}

export function sortPendingInvoiceRows(
  rows: PendingInvoiceRow[],
  columnId: PendingInvoiceColumnId | null,
  descending: boolean,
): PendingInvoiceRow[] {
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

/**
 * Distinct values for a column popover, excluding that column's own selection so
 * the option list does not collapse to what is already checked.
 */
export function pendingInvoiceColumnOptions(
  rows: PendingInvoiceRow[],
  columnId: PendingInvoiceColumnId,
): PendingInvoiceCell[] {
  const seen = new Map<string, string>();

  for (const row of rows) {
    const cell = pendingInvoiceCell(row, columnId);
    if (!seen.has(cell.value)) seen.set(cell.value, cell.label);
  }

  const options = [...seen].map(([value, label]) => ({ value, label }));
  const numeric = columnId === 'dias' || columnId === 'fecha';

  return options.sort((a, b) =>
    numeric
      ? Number(b.value.replaceAll('-', '')) - Number(a.value.replaceAll('-', ''))
      : a.label.localeCompare(b.label, 'es-MX'),
  );
}

export function collectPendingInvoiceCompanies(
  rows: PendingInvoiceRow[],
): string[] {
  return [...new Set(rows.map(row => row.compania))].sort((a, b) =>
    a.localeCompare(b, 'es-MX'),
  );
}

export function summarizePendingInvoiceRows(
  rows: PendingInvoiceRow[],
): PendingInvoiceSummary {
  return rows.reduce<PendingInvoiceSummary>(
    (accumulator, row) => ({
      eventos: accumulator.eventos + 1,
      subtotal: accumulator.subtotal + row.subtotal,
      iva: accumulator.iva + row.iva,
      total: accumulator.total + row.total,
    }),
    { eventos: 0, subtotal: 0, iva: 0, total: 0 },
  );
}

export function buildPendingInvoiceMonthWindow(
  months: number,
  reference = new Date(),
): string[] {
  return Array.from({ length: months }, (_, index) => {
    const date = new Date(
      reference.getFullYear(),
      reference.getMonth() - (months - 1 - index),
      1,
    );
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  });
}
