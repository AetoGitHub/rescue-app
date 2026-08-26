import type {
  PendingChargeApiRow,
  PendingChargeApiStatus,
  PendingChargeRow,
  PendingChargeStatus,
} from '~/interfaces/invoicing/pending-charge';

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

const API_STATUSES: PendingChargeApiStatus[] = [
  'vencida',
  'por_vencer',
  'bien',
];

export function mapPendingChargeStatus(
  value: string | null | undefined,
): PendingChargeStatus {
  if (!value?.trim()) return 'sin_credito';
  const normalized = value.trim().toLowerCase();
  if ((API_STATUSES as string[]).includes(normalized)) {
    return normalized as PendingChargeApiStatus;
  }
  return 'sin_credito';
}

function resolveId(raw: PendingChargeApiRow): number {
  const id = toNumber(raw.id, Number.NaN);
  if (Number.isFinite(id) && id > 0) return id;
  throw new Error(
    `El cliente ${toText(raw.client_name) || 'sin nombre'} no tiene un ID válido`,
  );
}

export function mapPendingChargeApiRow(raw: PendingChargeApiRow): PendingChargeRow {
  return {
    id: resolveId(raw),
    cliente: toText(raw.client_name) || '—',
    compania: toText(raw.company_name) || '—',
    rfc: toText(raw.rfc) || '—',
    responsable: toText(raw.responsible_name) || '—',
    fecha_factura: toText(raw.invoice_date),
    vencimiento: toText(raw.due_date),
    dias_vencidos: Math.max(0, Math.trunc(toNumber(raw.days_overdue))),
    status: mapPendingChargeStatus(
      typeof raw.status === 'string' ? raw.status : null,
    ),
    total: toNumber(raw.total),
  };
}

export function mapPendingChargeApiRows(
  rows: PendingChargeApiRow[],
): PendingChargeRow[] {
  return rows.map(mapPendingChargeApiRow);
}
