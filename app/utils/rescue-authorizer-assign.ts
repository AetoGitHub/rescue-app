import type { OperationalRescueStatus } from '~/constants/operational-kanban';
import type { RescueCardDetail } from '~/interfaces/rescue/detail';

const TERMINAL_AUTHORIZER_ASSIGN_STATUSES = new Set<OperationalRescueStatus>([
  'closed',
  'closed_unpaid',
  'canceled',
]);

export function hasRescueAuthorizerAssigned(detail: RescueCardDetail): boolean {
  return detail.authorizer_id != null;
}

export function canAssignRescueAuthorizer(detail: RescueCardDetail): boolean {
  return !TERMINAL_AUTHORIZER_ASSIGN_STATUSES.has(
    detail.operative_status as OperationalRescueStatus,
  );
}

/** Allows authorizer assignment in terminal statuses when an unlock edit session is active, or always for superusers. */
export function canAssignRescueAuthorizerWithUnlock(
  detail: RescueCardDetail,
  unlockSessionUntil: string | null | undefined,
  isSuperuser?: boolean,
): boolean {
  if (isSuperuser) return true;
  if (canAssignRescueAuthorizer(detail)) return true;
  return Boolean(unlockSessionUntil?.trim());
}
