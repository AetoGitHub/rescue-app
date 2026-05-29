import type { RescueQuoteLine } from '~/interfaces/rescue';

/**
 * Map GET quote detail response to editor lines.
 * Implement when RESCUE_QUOTE_DETAIL_PATH is available.
 */
export function mapRescueQuoteDetailFromApi(
  _raw: Record<string, unknown>,
): RescueQuoteLine[] {
  return [];
}
