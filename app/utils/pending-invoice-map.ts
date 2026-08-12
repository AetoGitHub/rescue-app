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
  iso: string,
  reference = new Date(),
): number {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 0;

  const start = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  );
  const end = Date.UTC(
    reference.getFullYear(),
    reference.getMonth(),
    reference.getDate(),
  );
  return Math.max(0, Math.round((end - start) / 86_400_000));
}

export function monthKeyFromPendingInvoiceDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '0000-00';
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function monthLabelFromPendingInvoiceDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
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

function mockStatus(folio: string): PendingInvoiceStatus {
  return hashPendingInvoiceFolio(folio) % 100 < 45
    ? 'En remisión'
    : 'Sin atender';
}

function mockOc(folio: string, status: PendingInvoiceStatus): string | null {
  if (status !== 'En remisión') return null;
  const hash = hashPendingInvoiceFolio(`${folio}:oc`);
  if (hash % 100 >= 60) return null;
  return `OC-${10000 + (hash % 90000)}`;
}

function mockFlag(folio: string, salt: string, chancePercent: number): boolean {
  return hashPendingInvoiceFolio(`${folio}:${salt}`) % 100 < chancePercent;
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
    ) ?? mockStatus(folio);

  const ocFromApi =
    toText(raw.oc) || toText(raw.purchase_order_number) || null;
  const oc = ocFromApi ?? mockOc(folio, status);

  const evidenciaRescate =
    typeof raw.has_service_evidence === 'boolean'
      ? raw.has_service_evidence
      : mockFlag(folio, 'service', 70);
  const evidenciaPagos =
    typeof raw.has_payment_evidence === 'boolean'
      ? raw.has_payment_evidence
      : mockFlag(folio, 'payment', 45);

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
    evidencia_rescate: evidenciaRescate,
    evidencia_pagos: evidenciaPagos,
    oc,
  };
}

export function mapPendingInvoiceApiRows(
  rows: PendingInvoiceApiRow[],
  reference = new Date(),
): PendingInvoiceRow[] {
  return rows.map(row => mapPendingInvoiceApiRow(row, reference));
}
