import type { OperationalRescueStatus } from '~/constants/operational-kanban';
import type { RescueCardDetail } from '~/interfaces/rescue/detail';
import { hasRescueQuote, rescueDetailToFlowContext } from '~/utils/rescue-operative-flow';

const TERMINAL_QUOTE_STATUSES = new Set<OperationalRescueStatus>([
  'closed',
  'closed_unpaid',
  'canceled',
]);

/** True when the detail tab may show the quote editor (create or update). */
export function canEditRescueQuote(detail: RescueCardDetail): boolean {
  return !TERMINAL_QUOTE_STATUSES.has(
    detail.operative_status as OperationalRescueStatus,
  );
}

/** Fallback hint from card detail before GET quote resolves. */
export function hasRescueQuoteOnDetail(detail: RescueCardDetail): boolean {
  return hasRescueQuote(rescueDetailToFlowContext(detail));
}
