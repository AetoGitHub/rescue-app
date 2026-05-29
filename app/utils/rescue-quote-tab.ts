import type { RescueCardDetail } from '~/interfaces/rescue/detail';
import {
  hasRescueQuote,
  rescueDetailToFlowContext,
} from '~/utils/rescue-operative-flow';

/** True when the detail tab may show the quote editor (create flow). */
export function canEditRescueQuote(detail: RescueCardDetail): boolean {
  return !hasRescueQuote(rescueDetailToFlowContext(detail));
}

export function hasRescueQuoteOnDetail(detail: RescueCardDetail): boolean {
  return !canEditRescueQuote(detail);
}
