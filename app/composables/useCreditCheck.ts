import type { RescueQuoteLine } from '~/interfaces/rescue';
import type { RescueCompanySettings } from '~/interfaces/rescue/company-settings';
import {
  assertClientCreditForQuote as assertClientCreditForQuoteUtil,
  type CreditCheckGateResult,
} from '~/utils/credit-check';

/**
 * Client credit gate before quote creation (`POST /api/credit/check/`).
 */
export function useCreditCheck() {
  const apiFetch = useApiFetch();

  async function assertClientCreditForQuote(
    clientId: number,
    lines: RescueQuoteLine[],
    settings: RescueCompanySettings | null | undefined,
    clientSellerId?: number | null,
  ): Promise<CreditCheckGateResult> {
    return assertClientCreditForQuoteUtil(
      apiFetch as Parameters<typeof assertClientCreditForQuoteUtil>[0],
      clientId,
      lines,
      settings,
      clientSellerId,
    );
  }

  return { assertClientCreditForQuote };
}
