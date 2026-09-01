import type {
  PendingInvoiceAdminStatus,
  PendingInvoiceApiRow,
  PendingInvoiceRow,
  PendingInvoiceStatus,
} from '~/interfaces/invoicing/pending-invoice';

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function toText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

const PENDING_INVOICE_DMY_RE = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

/** Accepts `DD/MM/AAAA` from the API, with ISO as a fallback. */
export function parsePendingInvoiceDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const dmy = PENDING_INVOICE_DMY_RE.exec(trimmed);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    const year = Number(dmy[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (
      date.getUTCFullYear() !== year
      || date.getUTCMonth() !== month - 1
      || date.getUTCDate() !== day
    ) {
      return null;
    }
    return date;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function utcDateParts(date: Date) {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth(),
    day: date.getUTCDate(),
  };
}

/** Stable 32-bit hash so mock flags match between SSR and client. */
export function hashPendingInvoiceFolio(folio: string): number {
  let hash = 2166136261;
  for (let index = 0; index < folio.length; index += 1) {
    hash ^= folio.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function daysSincePendingInvoiceDate(
  value: string,
  reference = new Date(),
): number {
  const date = parsePendingInvoiceDate(value);
  if (date == null) return 0;

  const startParts = utcDateParts(date);
  const start = Date.UTC(startParts.year, startParts.month, startParts.day);
  const end = Date.UTC(
    reference.getFullYear(),
    reference.getMonth(),
    reference.getDate(),
  );
  return Math.max(0, Math.round((end - start) / 86_400_000));
}

export function monthKeyFromPendingInvoiceDate(value: string): string {
  const date = parsePendingInvoiceDate(value);
  if (date == null) return '0000-00';
  const { year, month } = utcDateParts(date);
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

export function monthLabelFromPendingInvoiceDate(value: string): string {
  const date = parsePendingInvoiceDate(value);
  if (date == null) return '—';
  const label = date
    .toLocaleDateString('es-MX', { month: 'short', timeZone: 'UTC' })
    .replace('.', '');
  return `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
}

function mapAdminStatus(
  value: string | null | undefined,
): PendingInvoiceStatus | null {
  if (!value?.trim()) return null;
  const normalized = value.trim().toLowerCase() as PendingInvoiceAdminStatus | string;
  if (normalized === 'in_remittance') return 'En remisión';
  if (normalized === 'unattended') return 'Sin atender';
  return null;
}

function resolveId(raw: PendingInvoiceApiRow): number {
  const id = toNumber(raw.id, Number.NaN);
  if (Number.isFinite(id) && id > 0) return id;
  throw new Error(`El rescate ${toText(raw.folio) || 'sin folio'} no tiene un ID válido`);
}

export function mapPendingInvoiceApiRow(
  raw: PendingInvoiceApiRow,
  reference = new Date(),
): PendingInvoiceRow {
  const folio = toText(raw.folio) || '—';
  const fecha = toText(raw.date) || reference.toISOString();
  const status =
    mapAdminStatus(
      typeof raw.admin_status === 'string' ? raw.admin_status : null,
    ) ?? 'Sin atender';

  const oc =
    toText(raw.purchase_order)
    || toText(raw.oc)
    || toText(raw.purchase_order_number)
    || null;
  const ocPdf = toText(raw.oc_pdf) || null;
  const factura =
    toText(raw.invoice_folio)
    || toText(raw.invoice_number)
    || toText(raw.factura)
    || null;

  return {
    id: resolveId(raw),
    folio,
    compania_grupo: toText(raw.client_name) || '—',
    compania: toText(raw.company_name) || '—',
    responsable: toText(raw.operator_name) || '—',
    unidad: toText(raw.vehicle) || '—',
    autorizador: toText(raw.authorizer) || '—',
    mes: monthLabelFromPendingInvoiceDate(fecha),
    mes_key: monthKeyFromPendingInvoiceDate(fecha),
    fecha,
    dias: daysSincePendingInvoiceDate(fecha, reference),
    status,
    descripcion: toText(raw.service_description),
    costo_tecnico: toNumber(raw.technical_cost),
    subtotal: toNumber(raw.sub_total),
    iva: toNumber(raw.iva),
    total: toNumber(raw.total),
    evidencia_rescate: raw.has_service_evidence === true,
    evidencia_pagos: raw.has_payment_evidence === true,
    oc,
    oc_pdf: ocPdf,
    factura,
  };
}

export function mapPendingInvoiceApiRows(
  rows: PendingInvoiceApiRow[],
  reference = new Date(),
): PendingInvoiceRow[] {
  return rows.map(row => mapPendingInvoiceApiRow(row, reference));
}
