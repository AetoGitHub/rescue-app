import type { QuoteClassifierResponse } from '~/interfaces/rescue/quote-classifier';
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
    return await $fetch<QuoteClassifierResponse>(
      resolveN8nRescueClassifierUrl(),
      {
        method: 'POST',
        body: payload,
      },
    );
  } catch (error) {
    forwardFetchError(error);
  }
});
