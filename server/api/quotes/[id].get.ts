import { joinURL, withQuery } from 'ufo';
import { forwardFetchError } from '../../utils/forward-fetch-error';
import {
  buildQuotePdfUpstreamQuery,
  parseQuotePdfRescueId,
  quotePdfAuthorizationHeader,
  resolveQuotePdfApiUrl,
} from '../../utils/quote-pdf-api';

interface QuotePdfUrlResponse {
  url: string;
}

function quotePdfErrorMessage(body: unknown): string {
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    const record = body as Record<string, unknown>;
    const message = record.message;
    if (typeof message === 'string' && message.trim()) {
      return message.trim();
    }
  }

  if (typeof body === 'string' && body.trim()) {
    return body.trim();
  }

  return 'No se pudo generar la cotización';
}

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  const token = session.token?.trim();

  if (!token) {
    throw createError({
      statusCode: 401,
      message: 'Sesión no válida',
    });
  }

  const rescueId = parseQuotePdfRescueId(getRouterParam(event, 'id'));
  if (rescueId == null) {
    throw createError({
      statusCode: 400,
      message: 'Identificador de rescate inválido',
    });
  }

  const query = getQuery(event);
  const upstreamQuery = buildQuotePdfUpstreamQuery(query);
  const download = upstreamQuery.download === 'true';
  const target = withQuery(
    joinURL(resolveQuotePdfApiUrl(), `/quotes/${rescueId}`),
    upstreamQuery,
  );

  const headers = {
    Authorization: quotePdfAuthorizationHeader(token),
    'Accept-Language': 'es',
  };

  if (download) {
    let response: Response;

    try {
      response = await fetch(target, {
        headers,
      });
    } catch {
      throw createError({
        statusCode: 502,
        message: 'No se pudo conectar con el generador de PDF',
      });
    }

    if (!response.ok) {
      const body = await response.text();
      let message = 'No se pudo descargar la cotización';

      try {
        message = quotePdfErrorMessage(JSON.parse(body));
      } catch {
        message = quotePdfErrorMessage(body);
      }

      throw createError({
        statusCode: response.status,
        message,
      });
    }

    setResponseHeader(
      event,
      'Content-Type',
      response.headers.get('content-type') || 'application/pdf',
    );

    const disposition = response.headers.get('content-disposition');
    if (disposition) {
      setResponseHeader(event, 'Content-Disposition', disposition);
    }

    if (response.body == null) {
      throw createError({
        statusCode: 502,
        message: 'Respuesta de PDF vacía',
      });
    }

    return sendStream(event, response.body);
  }

  try {
    return await $fetch<QuotePdfUrlResponse>(target, {
      headers,
      query: upstreamQuery,
    });
  } catch (error) {
    forwardFetchError(error);
  }
});
