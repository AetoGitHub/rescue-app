import { RESCUE_OPERATIVE_TOAST } from '~/constants/rescue-operative-flow';
import type { RescueCardDetail } from '~/interfaces/rescue/detail';
import type {
  RescueFooterAction,
} from '~/interfaces/rescue/operative';
import { isCloseEvidenceGuardedAction } from '~/utils/rescue-evidence-requirements';

export function hasRescueSupplierAssigned(detail: RescueCardDetail): boolean {
  return detail.supplier_id != null;
}

export function getCloseSupplierDisabledReason(
  detail: RescueCardDetail,
): string | undefined {
  if (detail.service_type === 'loan') return undefined;
  if (hasRescueSupplierAssigned(detail)) return undefined;
  return RESCUE_OPERATIVE_TOAST.supplierRequiredBeforeClose;
}

export function applyCloseSupplierGuard(
  actions: RescueFooterAction[],
  detail: RescueCardDetail,
): RescueFooterAction[] {
  const disabledReason = getCloseSupplierDisabledReason(detail);
  if (!disabledReason) return actions;

  return actions.map((item) => {
    if (!isCloseEvidenceGuardedAction(item.id)) return item;
    return {
      ...item,
      disabled: true,
      disabledReason,
    };
  });
}
