import { creditCheckPath } from '~/constants/client-credit-api';
import type { CreditCheckResponse } from '~/interfaces/catalogs/credit';
import type { RescueQuoteLine } from '~/interfaces/rescue';
import type { RescueCompanySettings } from '~/interfaces/rescue/company-settings';
import { buildRescueQuoteCreateBody } from '~/utils/rescue-quote-create';

type CreditCheckFetcher = <T>(
  url: string,
  options?: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: unknown;
    query?: Record<string, unknown>;
    signal?: AbortSignal;
  },
) => Promise<T>;

export type CreditCheckGateResult =
  | { ok: true }
  | { ok: false; message: string };

/**
 * Validates client credit before creating a quote.
 * Skips the API call when there are no quote lines to save.
 */
export async function assertClientCreditForQuote(
  fetcher: CreditCheckFetcher,
  clientId: number,
  lines: RescueQuoteLine[],
  settings: RescueCompanySettings | null | undefined,
  clientSellerId?: number | null,
): Promise<CreditCheckGateResult> {
  const quoteBody = buildRescueQuoteCreateBody(0, lines, settings, {
    clientSellerId,
  });
  if (quoteBody == null) {
    return { ok: true };
  }

  try {
    const response = await fetcher<CreditCheckResponse>(creditCheckPath(), {
      method: 'POST',
      body: {
        client: clientId,
        amount: quoteBody.total,
      },
    });

    if (!response.status) {
      return { ok: false, message: response.message };
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, message: getFetchErrorMessage(error) };
  }
}
