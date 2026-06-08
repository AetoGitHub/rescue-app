import {
  RESCUE_EVIDENCE_TYPE_PAYMENT_PROVIDER,
  RESCUE_EVIDENCE_TYPE_SERVICE,
} from '~/constants/rescue-evidence-api';
import { RESCUE_OPERATIVE_TOAST } from '~/constants/rescue-operative-flow';
import type { RescueDetailTabValue } from '~/constants/operational-rescue-detail';
import type { RescueEvidence, RescueEvidenceType } from '~/interfaces/rescue/evidence';
import type {
  RescueFooterAction,
  RescueOperativeActionId,
} from '~/interfaces/rescue/operative';

export const CLOSE_OPERATIVE_ACTIONS = [
  'complete_service',
  'complete_project',
  'confirm_disbursement',
] as const satisfies readonly RescueOperativeActionId[];

export const MARK_AS_CLOSED_ACTION = 'mark_as_closed' as const;

export type CloseOperativeActionId = (typeof CLOSE_OPERATIVE_ACTIONS)[number];

const REQUIRED_CLOSE_EVIDENCE_TYPES: RescueEvidenceType[] = [
  RESCUE_EVIDENCE_TYPE_SERVICE,
];

export function isCloseOperativeAction(
  actionId: RescueOperativeActionId,
): actionId is CloseOperativeActionId {
  return (CLOSE_OPERATIVE_ACTIONS as readonly string[]).includes(actionId);
}

export function isCloseEvidenceGuardedAction(actionId: RescueOperativeActionId): boolean {
  return isCloseOperativeAction(actionId) || actionId === MARK_AS_CLOSED_ACTION;
}

export function hasRequiredCloseEvidences(evidences: RescueEvidence[]): boolean {
  return getMissingCloseEvidenceTypes(evidences).length === 0;
}

export function getMissingCloseEvidenceTypes(
  evidences: RescueEvidence[],
): RescueEvidenceType[] {
  return REQUIRED_CLOSE_EVIDENCE_TYPES.filter(
    (type) => !evidences.some((item) => item.type === type),
  );
}

export function getEvidenceRequiredToastMessage(
  _missing: RescueEvidenceType[],
): string {
  return RESCUE_OPERATIVE_TOAST.evidenceServiceRequired;
}

export function getEvidenceTabForMissingType(
  type: RescueEvidenceType,
): RescueDetailTabValue {
  return type === RESCUE_EVIDENCE_TYPE_SERVICE ? 'evidence' : 'supplier_payment';
}

export function getPrimaryEvidenceTabForMissing(
  missing: RescueEvidenceType[],
): RescueDetailTabValue {
  if (missing.includes(RESCUE_EVIDENCE_TYPE_SERVICE)) {
    return 'evidence';
  }
  return 'supplier_payment';
}

export function getCloseEvidenceDisabledReason(
  evidences: RescueEvidence[],
): string | undefined {
  if (hasRequiredCloseEvidences(evidences)) return undefined;
  return getEvidenceRequiredToastMessage(getMissingCloseEvidenceTypes(evidences));
}

export function applyCloseEvidenceGuard(
  actions: RescueFooterAction[],
  evidences: RescueEvidence[],
): RescueFooterAction[] {
  const disabledReason = getCloseEvidenceDisabledReason(evidences);
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
