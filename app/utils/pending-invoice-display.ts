import type { PendingInvoiceDetailRow, PendingInvoiceSparklinePoint } from '~/interfaces/invoicing/pending-invoice';

export type SparklineTrendDirection = 'up' | 'down' | 'flat';

export interface SparklineTrend {
  percentChange: number | null;
  direction: SparklineTrendDirection;
}

export type DaysSemaphoreColor = 'success' | 'warning' | 'error';

export function computeSparklineTrend(
  points: PendingInvoiceSparklinePoint[] | null | undefined,
): SparklineTrend {
  if (points == null || points.length < 2) {
    return { percentChange: null, direction: 'flat' };
  }

  const first = points[0]?.valor ?? 0;
  const last = points[points.length - 1]?.valor ?? 0;

  if (first === 0) {
    if (last === 0) {
      return { percentChange: 0, direction: 'flat' };
    }
    return { percentChange: 100, direction: 'up' };
  }

  const percentChange = ((last - first) / first) * 100;

  if (percentChange === 0) {
    return { percentChange: 0, direction: 'flat' };
  }

  return {
    percentChange,
    direction: percentChange > 0 ? 'up' : 'down',
  };
}

export function formatSparklineTrendPercent(
  trend: SparklineTrend,
): string | null {
  if (trend.percentChange == null) return null;
  const abs = Math.abs(trend.percentChange);
  const formatted = abs % 1 === 0 ? abs.toFixed(0) : abs.toFixed(1);
  return `${formatted}%`;
}

/** Pending going down is good (green); going up is bad (warning). */
export function sparklineTrendColorClass(
  direction: SparklineTrendDirection,
): string {
  if (direction === 'down') return 'text-success';
  if (direction === 'up') return 'text-warning';
  return 'text-muted';
}

export function sparklineTrendIcon(
  direction: SparklineTrendDirection,
): string {
  if (direction === 'down') return 'i-lucide-trending-down';
  if (direction === 'up') return 'i-lucide-trending-up';
  return 'i-lucide-minus';
}

export function daysSemaphoreColor(dias: number): DaysSemaphoreColor {
  if (dias < 30) return 'success';
  if (dias <= 60) return 'warning';
  return 'error';
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

export function formatMatrixMonthLabel(monthKey: string): string {
  const [yearPart, monthPart] = monthKey.split('-');
  const year = Number(yearPart);
  const month = Number(monthPart);
  if (!Number.isFinite(year) || !Number.isFinite(month)) return monthKey;

  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('es-MX', { month: 'short' });
}

export function sortMatrixMonthKeys(keys: string[]): string[] {
  return [...keys].sort((a, b) => a.localeCompare(b));
}

export function collectMatrixMonthKeys(
  rows: { meses: Record<string, unknown> }[],
): string[] {
  const keys = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row.meses)) {
      keys.add(key);
    }
  }
  return sortMatrixMonthKeys([...keys]);
}

export function needsAttention(row: Pick<PendingInvoiceDetailRow, 'status' | 'oc'>): boolean {
  if (row.status !== 'En remisión') return false;
  const oc = row.oc?.trim();
  return oc == null || oc === '' || oc === '–' || oc === '-';
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

export function daysSemaphoreTextClass(dias: number): string {
  const color = daysSemaphoreColor(dias);
  if (color === 'success') return 'text-success';
  if (color === 'warning') return 'text-warning';
  return 'text-error';
}

export function formatOptionalPendingCell(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : '—';
}

export function buildSparklinePolylinePoints(
  values: number[],
  width: number,
  height: number,
  padding = 2,
): string {
  if (values.length === 0) return '';

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  return values
    .map((value, index) => {
      const x =
        values.length === 1
          ? width / 2
          : padding + (index / (values.length - 1)) * innerWidth;
      const normalized = (value - min) / range;
      const y = padding + innerHeight - normalized * innerHeight;
      return `${x},${y}`;
    })
    .join(' ');
}
