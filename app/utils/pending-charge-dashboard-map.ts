import type { PendingChargeColumnMeta } from '~/constants/pending-charge';
import {
  PENDING_CHARGE_ORDERING_FIELDS,
  type PendingChargeOrderingField,
} from '~/constants/pending-charge-api';
import type {
  PendingChargeFilterSelection,
  PendingChargeStatus,
} from '~/interfaces/invoicing/pending-charge';

function positiveIds(items: PendingChargeFilterSelection[]): number[] {
  return items.map(item => item.id).filter(id => id > 0);
}

/** Comma-separated ids for `?company=` / `?client=`. */
export function pendingChargeCsvIdQuery(
  items: PendingChargeFilterSelection[],
): string | undefined {
  const ids = positiveIds(items);
  if (ids.length === 0) return undefined;
  return ids.join(',');
}

function isPendingChargeOrderingField(
  value: string,
): value is PendingChargeOrderingField {
  return (PENDING_CHARGE_ORDERING_FIELDS as readonly string[]).includes(value);
}

export function pendingChargeOrderingParam(
  meta: Pick<PendingChargeColumnMeta, 'ordering'> | { ordering?: string } | null | undefined,
  descending: boolean,
): string {
  const field = meta?.ordering;
  if (field == null || !isPendingChargeOrderingField(field)) return '';
  return descending ? `-${field}` : field;
}

/**
 * API `status` QP. `sin_credito` has no backend value, so mixed/none-credit
 * selections are applied client-side instead of sending `status`.
 */
export function pendingChargeStatusQuery(
  selected: PendingChargeStatus[],
): string | undefined {
  if (selected.length === 0) return undefined;
  if (selected.includes('sin_credito')) return undefined;
  const api = selected.filter(value => value !== 'sin_credito');
  if (api.length === 0) return undefined;
  return api.join(',');
}
