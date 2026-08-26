import type { PendingChargeStatus } from '~/interfaces/invoicing/pending-charge';

export type PendingChargeStatusColor =
  | 'error'
  | 'warning'
  | 'success'
  | 'neutral';

export function pendingChargeStatusColor(
  status: PendingChargeStatus,
): PendingChargeStatusColor {
  if (status === 'vencida') return 'error';
  if (status === 'por_vencer') return 'warning';
  if (status === 'bien') return 'success';
  return 'neutral';
}

export function pendingChargeDaysColor(
  status: PendingChargeStatus,
  dias: number,
): PendingChargeStatusColor {
  if (status === 'sin_credito') return 'neutral';
  if (status === 'vencida' || dias > 0) return 'error';
  if (status === 'por_vencer') return 'warning';
  return 'success';
}

export function pendingChargeRowAgeClass(status: PendingChargeStatus): string {
  const color = pendingChargeStatusColor(status);
  if (color === 'success') return 'bg-success/[0.04]';
  if (color === 'warning') return 'bg-warning/[0.07]';
  if (color === 'error') return 'bg-error/[0.07]';
  return '';
}
