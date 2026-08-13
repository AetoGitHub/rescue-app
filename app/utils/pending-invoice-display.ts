import type {
  PendingInvoiceDaysPromColor,
  PendingInvoiceRow,
} from '~/interfaces/invoicing/pending-invoice';

export type DaysSemaphoreColor = 'success' | 'warning' | 'error';

const RESPONSABLE_BADGE_COLORS = [
  'primary',
  'secondary',
  'info',
  'success',
  'warning',
] as const;

export type ResponsableBadgeColor =
  (typeof RESPONSABLE_BADGE_COLORS)[number];

/** Stable color per name so the same responsable always reads the same chip. */
export function responsableBadgeColor(
  name: string,
): ResponsableBadgeColor {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) >>> 0;
  }
  return RESPONSABLE_BADGE_COLORS[hash % RESPONSABLE_BADGE_COLORS.length]!;
}

export function daysSemaphoreColor(dias: number): DaysSemaphoreColor {
  if (dias < 30) return 'success';
  if (dias <= 60) return 'warning';
  return 'error';
}

export function daysSemaphoreTextClass(dias: number): string {
  const color = daysSemaphoreColor(dias);
  if (color === 'success') return 'text-success';
  if (color === 'warning') return 'text-warning';
  return 'text-error';
}

/** Prefer API `dias_prom_color`; fall back to the 30/60 semaphore when missing. */
export function pendingInvoiceDaysPromTextClass(
  color: PendingInvoiceDaysPromColor | null | undefined,
  dias: number | null | undefined,
): string {
  if (color === 'verde') return 'text-success';
  if (color === 'amarillo') return 'text-warning';
  if (color === 'rojo') return 'text-error';
  if (dias == null) return 'text-muted';
  return daysSemaphoreTextClass(dias);
}

/** Whole-row tint by age; kept faint so the table still reads as data, not alarm. */
export function pendingInvoiceRowAgeClass(dias: number): string {
  const color = daysSemaphoreColor(dias);
  if (color === 'success') return 'bg-success/[0.04]';
  if (color === 'warning') return 'bg-warning/[0.07]';
  return 'bg-error/[0.07]';
}

/** In remittance without a purchase order: the automation could not find one. */
export function needsAttention(
  row: Pick<PendingInvoiceRow, 'status' | 'oc'>,
): boolean {
  if (row.status !== 'En remisión') return false;
  const oc = row.oc?.trim();
  return oc == null || oc === '' || oc === '–' || oc === '-';
}

const pendingInvoiceMoneyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const pendingInvoiceCompactMoneyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  notation: 'compact',
  maximumFractionDigits: 1,
});

export function formatPendingInvoiceMoney(value: number): string {
  return pendingInvoiceMoneyFormatter.format(value);
}

/** Matrix cells hold two values per month, so amounts are abbreviated. */
export function formatPendingInvoiceMoneyCompact(value: number): string {
  if (value === 0) return '—';
  return pendingInvoiceCompactMoneyFormatter.format(value);
}

export function formatPendingInvoiceDate(iso: string | null | undefined): string {
  if (!iso?.trim()) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatPendingInvoiceDateShort(
  iso: string | null | undefined,
): string {
  if (!iso?.trim()) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatPendingInvoiceHeaderDate(date = new Date()): string {
  return date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function monthsBehindCurrent(monthKey: string, now = new Date()): number {
  const [yearPart, monthPart] = monthKey.split('-');
  const year = Number(yearPart);
  const month = Number(monthPart);
  if (!Number.isFinite(year) || !Number.isFinite(month)) return 0;

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  return (currentYear - year) * 12 + (currentMonth - month);
}

export function matrixCellAgeClass(
  monthKey: string,
  now = new Date(),
): string {
  const monthsBehind = monthsBehindCurrent(monthKey, now);
  if (monthsBehind <= 0) return '';
  if (monthsBehind === 1) return 'bg-warning/10';
  return 'bg-error/10';
}

/** Matrix headers read `Mes Año` so a 12+ month window stays unambiguous. */
export function formatMatrixMonthLabel(monthKey: string): string {
  const [yearPart, monthPart] = monthKey.split('-');
  const year = Number(yearPart);
  const month = Number(monthPart);
  if (!Number.isFinite(year) || !Number.isFinite(month)) return monthKey;

  const date = new Date(year, month - 1, 1);
  const label = date
    .toLocaleDateString('es-MX', { month: 'short' })
    .replace('.', '');
  return `${label.charAt(0).toUpperCase()}${label.slice(1)} ${year}`;
}

export function sortMatrixMonthKeys(keys: string[]): string[] {
  return [...keys].sort((a, b) => a.localeCompare(b));
}

export function formatOptionalPendingCell(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : '—';
}
