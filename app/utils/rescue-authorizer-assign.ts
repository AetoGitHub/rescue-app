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
