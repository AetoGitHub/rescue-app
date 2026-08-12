import type {
  PendingInvoiceMatrix,
  PendingInvoiceMatrixAuthorizerRow,
  PendingInvoiceMatrixCell,
  PendingInvoiceRow,
  PendingInvoiceSellerRow,
  PendingInvoiceSummary,
} from '~/interfaces/invoicing/pending-invoice';
import type { PendingInvoiceColumnId } from '~/constants/pending-invoice';
import {
  formatPendingInvoiceDateShort,
  formatPendingInvoiceMoney,
  needsAttention,
  sortMatrixMonthKeys,
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

export function buildPendingInvoiceSellerRows(
  rows: PendingInvoiceRow[],
): PendingInvoiceSellerRow[] {
  const groups = new Map<string, PendingInvoiceRow[]>();

  for (const row of rows) {
    const current = groups.get(row.responsable);
    if (current) current.push(row);
    else groups.set(row.responsable, [row]);
  }

  const sellerRows = [...groups].map(([responsable, group]) => {
    const totalDays = group.reduce((sum, row) => sum + row.dias, 0);

    return {
      responsable,
      eventos: group.length,
      sin_atender: group.filter(row => row.status === 'Sin atender').length,
      remision: group.filter(row => row.status === 'En remisión').length,
      atencion: group.filter(row => needsAttention(row)).length,
      dias_prom: Math.round(totalDays / group.length),
      dias_max: group.reduce((max, row) => Math.max(max, row.dias), 0),
      subtotal: group.reduce((sum, row) => sum + row.subtotal, 0),
      iva: group.reduce((sum, row) => sum + row.iva, 0),
      total: group.reduce((sum, row) => sum + row.total, 0),
    } satisfies PendingInvoiceSellerRow;
  });

  return sellerRows.sort((a, b) => b.total - a.total);
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

function emptyCell(): PendingInvoiceMatrixCell {
  return { monto: 0, eventos: 0 };
}

function addToCells(
  cells: Record<string, PendingInvoiceMatrixCell>,
  monthKey: string,
  row: PendingInvoiceRow,
): void {
  const cell = cells[monthKey] ?? emptyCell();
  cell.monto += row.total;
  cell.eventos += 1;
  cells[monthKey] = cell;
}

export function buildPendingInvoiceMatrix(
  rows: PendingInvoiceRow[],
  months: number,
  reference = new Date(),
): PendingInvoiceMatrix {
  const monthKeys = buildPendingInvoiceMonthWindow(months, reference);
  const windowSet = new Set(monthKeys);
  const scoped = rows.filter(row => windowSet.has(row.mes_key));

  const companies = new Map<
    string,
    {
      meses: Record<string, PendingInvoiceMatrixCell>;
      total: number;
      eventos: number;
      autorizadores: Map<
        string,
        {
          meses: Record<string, PendingInvoiceMatrixCell>;
          total: number;
          eventos: number;
        }
      >;
    }
  >();

  const totals = {
    meses: {} as Record<string, PendingInvoiceMatrixCell>,
    total: 0,
    eventos: 0,
  };

  for (const row of scoped) {
    const company =
      companies.get(row.compania) ??
      { meses: {}, total: 0, eventos: 0, autorizadores: new Map() };

    addToCells(company.meses, row.mes_key, row);
    company.total += row.total;
    company.eventos += 1;

    const authorizerKey = row.autorizador.trim() || '—';
    const authorizer =
      company.autorizadores.get(authorizerKey) ??
      { meses: {}, total: 0, eventos: 0 };

    addToCells(authorizer.meses, row.mes_key, row);
    authorizer.total += row.total;
    authorizer.eventos += 1;
    company.autorizadores.set(authorizerKey, authorizer);

    companies.set(row.compania, company);

    addToCells(totals.meses, row.mes_key, row);
    totals.total += row.total;
    totals.eventos += 1;
  }

  const matrixRows = [...companies]
    .map(([compania, company]) => ({
      compania,
      meses: company.meses,
      total: company.total,
      eventos: company.eventos,
      autorizadores: [...company.autorizadores]
        .map(
          ([autorizador, authorizer]) =>
            ({
              autorizador,
              meses: authorizer.meses,
              total: authorizer.total,
              eventos: authorizer.eventos,
            }) satisfies PendingInvoiceMatrixAuthorizerRow,
        )
        .sort((a, b) => b.total - a.total),
    }))
    .sort((a, b) => b.total - a.total);

  return {
    month_keys: sortMatrixMonthKeys(monthKeys),
    rows: matrixRows,
    totals,
  };
}
