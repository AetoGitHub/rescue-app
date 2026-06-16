import { N8N_RESCUE_CLASSIFIER_DEFAULT } from '~/constants/quote-classifier-api';
import type { QuoteClassifierRequestBody } from '~/interfaces/rescue/quote-classifier';
import { parseQuoteClassifierRequestBody } from '~/utils/rescue-quote-classifier';

export function resolveN8nRescueClassifierUrl(): string {
  const config = useRuntimeConfig();
  return config.n8nRescueClassifierUrl || N8N_RESCUE_CLASSIFIER_DEFAULT;
}

export function readQuoteClassifierRequestBody(
  body: unknown,
): QuoteClassifierRequestBody {
  const parsed = parseQuoteClassifierRequestBody(body);
  if (parsed == null) {
    throw createError({
      statusCode: 400,
      message: 'Indica un texto o imagen válidos para clasificar',
    });
  }
  return parsed;
}
