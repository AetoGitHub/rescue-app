import type { PendingInvoiceColumnMeta } from '~/constants/pending-invoice';
import { PENDING_INVOICE_DEFAULT_ORDERING } from '~/constants/pending-invoice-api';
import type {
  PendingInvoiceByResponsibleApiRow,
  PendingInvoiceCompanyMatrixApiCell,
  PendingInvoiceCompanyMatrixApiRow,
  PendingInvoiceCompanySelection,
  PendingInvoiceDaysPromColor,
  PendingInvoiceMatrix,
  PendingInvoiceMatrixCell,
  PendingInvoiceMatrixRow,
  PendingInvoiceSellerRow,
} from '~/interfaces/invoicing/pending-invoice';
import { buildPendingInvoiceMonthWindow } from '~/utils/pending-invoice-aggregate';
import { sortMatrixMonthKeys } from '~/utils/pending-invoice-display';

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function toNullableNumber(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function toText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function mapPendingInvoiceDaysPromColor(
  value: unknown,
): PendingInvoiceDaysPromColor | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'verde') return 'verde';
  if (normalized === 'amarillo') return 'amarillo';
  if (normalized === 'rojo') return 'rojo';
  return null;
}

/** Positive ids for multi-value dashboard query params. */
export function pendingInvoiceCompanyQueryIds(
  companies: PendingInvoiceCompanySelection[],
): number[] {
  return companies.map(company => company.id).filter(id => id > 0);
}

/**
 * Comma-separated ids for `?company=`, `?client=`, etc.
 */
export function pendingInvoiceCsvIdQuery(
  items: PendingInvoiceCompanySelection[],
): string | undefined {
  const ids = pendingInvoiceCompanyQueryIds(items);
  if (ids.length === 0) return undefined;
  return ids.join(',');
}

/** @deprecated Use pendingInvoiceCsvIdQuery. */
export function pendingInvoiceCompanyQuery(
  companies: PendingInvoiceCompanySelection[],
): string | undefined {
  return pendingInvoiceCsvIdQuery(companies);
}

export function pendingInvoiceOrderingParam(
  meta: Pick<PendingInvoiceColumnMeta, 'ordering' | 'invertOrdering'> | null | undefined,
  descending: boolean,
): string {
  if (meta?.ordering == null) return PENDING_INVOICE_DEFAULT_ORDERING;
  const apiDescending = meta.invertOrdering === true ? !descending : descending;
  return apiDescending ? `-${meta.ordering}` : meta.ordering;
}

export function mapPendingInvoiceByResponsibleRow(
  raw: PendingInvoiceByResponsibleApiRow,
): PendingInvoiceSellerRow {
  return {
    id: toNumber(raw.id),
    responsable: toText(raw.responsible_name) || '—',
    eventos: toNumber(raw.eventos),
    sin_atender: toNumber(raw.sin_atender),
    remision: toNumber(raw.remision),
    atencion: toNumber(raw.atencion),
    subtotal: toNumber(raw.subtotal),
    iva: toNumber(raw.iva),
    total: toNumber(raw.total),
    porcentaje_facturado: toNumber(raw.porcentaje_facturado),
  };
}

function mapMatrixCell(
  cell: PendingInvoiceCompanyMatrixApiCell | null | undefined,
): PendingInvoiceMatrixCell {
  return {
    monto: toNumber(cell?.total),
    eventos: toNumber(cell?.eventos),
  };
}

function mapMatrixMonths(
  meses: Record<string, PendingInvoiceCompanyMatrixApiCell> | null | undefined,
): Record<string, PendingInvoiceMatrixCell> {
  const result: Record<string, PendingInvoiceMatrixCell> = {};
  if (!meses) return result;
  for (const [key, cell] of Object.entries(meses)) {
    result[key] = mapMatrixCell(cell);
  }
  return result;
}

function mapMatrixRow(
  raw: PendingInvoiceCompanyMatrixApiRow,
): PendingInvoiceMatrixRow {
  const cliente = toText(raw.client_name) || '—';
  const clientId = toNullableNumber(raw.client_id);
  const meses = mapMatrixMonths(raw.meses);
  const eventosFromCells = Object.values(meses).reduce(
    (sum, cell) => sum + cell.eventos,
    0,
  );
  const responsable = toText(raw.responsible_name);

  return {
    row_key:
      clientId != null && clientId > 0
        ? `client:${clientId}`
        : `name:${cliente}`,
    client_id: clientId,
    cliente,
    responsable: responsable || '—',
    meses,
    total: toNumber(raw.total),
    eventos: eventosFromCells,
  };
}

function emptyCell(): PendingInvoiceMatrixCell {
  return { monto: 0, eventos: 0 };
}

/**
 * Maps the company_matrix array response into the UI matrix shape.
 * Month keys prefer the API payload; falls back to a local window of `months`.
 */
export function mapPendingInvoiceCompanyMatrix(
  rows: PendingInvoiceCompanyMatrixApiRow[],
  months: number,
  reference = new Date(),
): PendingInvoiceMatrix {
  const mappedRows = rows.map(mapMatrixRow);
  const keysFromApi = new Set<string>();
  for (const row of mappedRows) {
    for (const key of Object.keys(row.meses)) keysFromApi.add(key);
  }

  const monthKeys =
    keysFromApi.size > 0
      ? sortMatrixMonthKeys([...keysFromApi])
      : buildPendingInvoiceMonthWindow(months, reference);

  const totals = {
    meses: {} as Record<string, PendingInvoiceMatrixCell>,
    total: 0,
    eventos: 0,
  };

  for (const key of monthKeys) {
    totals.meses[key] = emptyCell();
  }

  for (const row of mappedRows) {
    totals.total += row.total;
    totals.eventos += row.eventos;
    for (const key of monthKeys) {
      const cell = row.meses[key] ?? emptyCell();
      const bucket = totals.meses[key] ?? emptyCell();
      bucket.monto += cell.monto;
      bucket.eventos += cell.eventos;
      totals.meses[key] = bucket;
    }
  }

  const sortedRows = [...mappedRows].sort((a, b) => b.total - a.total);

  return {
    month_keys: monthKeys,
    rows: sortedRows,
    totals,
  };
}
