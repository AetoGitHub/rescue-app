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

const SERVICE_CLOSE_EVIDENCE_TYPES: RescueEvidenceType[] = [
  RESCUE_EVIDENCE_TYPE_SERVICE,
];

const MARK_CLOSED_EVIDENCE_TYPES: RescueEvidenceType[] = [
  RESCUE_EVIDENCE_TYPE_PAYMENT_PROVIDER,
];

export function getRequiredEvidenceTypesForCloseAction(
  actionId: RescueOperativeActionId,
): RescueEvidenceType[] {
  if (actionId === MARK_AS_CLOSED_ACTION) {
    return MARK_CLOSED_EVIDENCE_TYPES;
  }
  if (isCloseOperativeAction(actionId)) {
    return SERVICE_CLOSE_EVIDENCE_TYPES;
  }
  return [];
}

export function getMissingEvidenceTypesForAction(
  evidences: RescueEvidence[],
  actionId: RescueOperativeActionId,
): RescueEvidenceType[] {
  return getRequiredEvidenceTypesForCloseAction(actionId).filter(
    (type) => !evidences.some((item) => item.type === type),
  );
}

export function hasRequiredEvidencesForAction(
  evidences: RescueEvidence[],
  actionId: RescueOperativeActionId,
): boolean {
  return getMissingEvidenceTypesForAction(evidences, actionId).length === 0;
}

/** @deprecated Use hasRequiredEvidencesForAction with a close action id. */
export function hasRequiredCloseEvidences(evidences: RescueEvidence[]): boolean {
  return hasRequiredEvidencesForAction(evidences, 'complete_service');
}

/** @deprecated Use getMissingEvidenceTypesForAction with a close action id. */
export function getMissingCloseEvidenceTypes(
  evidences: RescueEvidence[],
): RescueEvidenceType[] {
  return getMissingEvidenceTypesForAction(evidences, 'complete_service');
}
export function isCloseOperativeAction(
  actionId: RescueOperativeActionId,
): actionId is CloseOperativeActionId {
  return (CLOSE_OPERATIVE_ACTIONS as readonly string[]).includes(actionId);
}

export function isCloseEvidenceGuardedAction(actionId: RescueOperativeActionId): boolean {
  return isCloseOperativeAction(actionId) || actionId === MARK_AS_CLOSED_ACTION;
}

export function getEvidenceRequiredToastMessage(
  missing: RescueEvidenceType[],
): string {
  if (missing.includes(RESCUE_EVIDENCE_TYPE_PAYMENT_PROVIDER)) {
    return RESCUE_OPERATIVE_TOAST.evidencePaymentRequired;
  }
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
  actionId: RescueOperativeActionId,
): string | undefined {
  if (hasRequiredEvidencesForAction(evidences, actionId)) return undefined;
  return getEvidenceRequiredToastMessage(
    getMissingEvidenceTypesForAction(evidences, actionId),
  );
}

export function applyCloseEvidenceGuard(
  actions: RescueFooterAction[],
  evidences: RescueEvidence[],
): RescueFooterAction[] {
  return actions.map((item) => {
    if (!isCloseEvidenceGuardedAction(item.id)) return item;

    const disabledReason = getCloseEvidenceDisabledReason(evidences, item.id);
    if (!disabledReason) return item;

    return {
      ...item,
      disabled: true,
      disabledReason,
    };
  });
}
