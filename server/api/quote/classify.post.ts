import { normalizeQuoteClassifierResponse } from '~/utils/rescue-quote-classifier';
import { forwardFetchError } from '../../utils/forward-fetch-error';
import {
  readQuoteClassifierRequestBody,
  resolveN8nRescueClassifierUrl,
} from '../../utils/quote-classifier-n8n';

export default defineEventHandler(async (event) => {
  await requireUserSession(event);

  const body = await readBody(event);
  const payload = readQuoteClassifierRequestBody(body);

  try {
    const raw = await $fetch<unknown>(resolveN8nRescueClassifierUrl(), {
      method: 'POST',
      body: payload,
    });

    const normalized = normalizeQuoteClassifierResponse(raw);
    if (normalized == null) {
      throw createError({
        statusCode: 502,
        message: 'Respuesta inválida del clasificador',
      });
    }

    return normalized;
  } catch (error) {
    forwardFetchError(error);
  }
});
