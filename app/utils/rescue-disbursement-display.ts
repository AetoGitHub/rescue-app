import { getRescuePaymentMethodLabel } from '~/utils/administrative-rescue-display';
import { formatRescueCardMoney } from '~/utils/operational-rescue-card';

const EMPTY = '—';

/** Advance fields from rescue card/detail summary. */
export interface RescueAdvanceSummary {
  advance_requested?: boolean;
  advance_amount?: string | number | null;
  advance_received?: boolean | null;
}

export type RescueAdvanceStatusKind =
  | 'not_requested'
  | 'pending'
  | 'received';

export function getRescueAdvanceStatusKind(
  summary: RescueAdvanceSummary,
): RescueAdvanceStatusKind {
  if (!summary.advance_requested) return 'not_requested';
  if (summary.advance_received === true) return 'received';
  return 'pending';
}

export function getRescueAdvanceStatusLabel(
  kind: RescueAdvanceStatusKind,
): string {
  switch (kind) {
    case 'not_requested':
      return 'No solicitado';
    case 'pending':
      return 'Pendiente';
    case 'received':
      return 'Pagado';
  }
}

export function getRescueAdvanceStatusColor(
  kind: RescueAdvanceStatusKind,
): 'neutral' | 'warning' | 'success' {
  switch (kind) {
    case 'not_requested':
      return 'neutral';
    case 'pending':
      return 'warning';
    case 'received':
      return 'success';
  }
}

export function hasRescueAdvanceSummary(
  summary: RescueAdvanceSummary,
): boolean {
  return summary.advance_requested === true;
}

/** Formats API date (`YYYY-MM-DD` or ISO) without UTC day-shift. */
export function formatDisbursementDate(
  value: string | null | undefined,
): string {
  if (!value?.trim()) return EMPTY;

  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(year, month - 1, day);
    if (Number.isNaN(date.getTime())) return EMPTY;
    return date.toLocaleDateString('es-MX');
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return EMPTY;
  return date.toLocaleDateString('es-MX');
}

export function formatDisbursementPaymentMethod(
  method: string | null | undefined,
): string {
  return getRescuePaymentMethodLabel(method);
}

export function formatDisbursementAdvanceAmount(
  amount: string | number | null | undefined,
): string {
  if (amount == null || String(amount).trim() === '') {
    return EMPTY;
  }
  return formatRescueCardMoney(amount);
}
