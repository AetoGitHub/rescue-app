import { SESSION_EXPIRED_MESSAGE } from '#shared/constants/session';
import { creditCheckPath } from '~/constants/client-credit-api';
import type { CreditCheckResponse } from '~/interfaces/catalogs/credit';
import type { RescueQuoteLine, RescueServiceType } from '~/interfaces/rescue';
import type { RescueCompanySettings } from '~/interfaces/rescue/company-settings';
import {
  getFetchErrorMessage,
  getFetchStatusCode,
} from '~/utils/fetch-error-message';
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

export type CreditCheckGateKind = 'insufficient' | 'session' | 'unavailable';

export type CreditCheckGateResult =
  | { ok: true }
  | { ok: false; kind: CreditCheckGateKind; title: string; message: string };

export const CREDIT_CHECK_UNAVAILABLE_TITLE = 'No se pudo validar el crédito';
export const CREDIT_INSUFFICIENT_TITLE = 'Crédito insuficiente';

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
  serviceType?: RescueServiceType | null,
): Promise<CreditCheckGateResult> {
  const quoteBody = buildRescueQuoteCreateBody(0, lines, settings, {
    clientSellerId,
    serviceType,
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
      return {
        ok: false,
        kind: 'insufficient',
        title: CREDIT_INSUFFICIENT_TITLE,
        message: response.message,
      };
    }

    return { ok: true };
  } catch (error) {
    const status = getFetchStatusCode(error);
    const message = getFetchErrorMessage(error);
    if (status === 401 || status === 403) {
      return {
        ok: false,
        kind: 'session',
        title: SESSION_EXPIRED_MESSAGE,
        message,
      };
    }

    return {
      ok: false,
      kind: 'unavailable',
      title: CREDIT_CHECK_UNAVAILABLE_TITLE,
      message,
    };
  }
}
