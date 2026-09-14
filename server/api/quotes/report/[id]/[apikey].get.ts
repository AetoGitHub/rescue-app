import { joinURL } from 'ufo';
import { parseRescueGuestTokenParam } from '../../../../utils/rescue-guest-api';
import {
  parseQuotePdfRescueId,
  resolveQuotePdfApiUrl,
} from '../../../../utils/quote-pdf-api';

/**
 * Enlace público (sin sesión): el PDF service autoriza con el apikey en la
 * URL, igual que el resto de los endpoints guest de rescue (evidencia,
 * cotización, aprobación).
 */
export default defineEventHandler(async (event) => {
  const rescueId = parseQuotePdfRescueId(getRouterParam(event, 'id'));
  const apiKey = parseRescueGuestTokenParam(getRouterParam(event, 'apikey'));

  if (rescueId == null || apiKey == null) {
    throw createError({
      statusCode: 400,
      message: 'Enlace no válido o expirado',
    });
  }

  const target = joinURL(
    resolveQuotePdfApiUrl(),
    `/quotes/report/${rescueId}/${encodeURIComponent(apiKey)}`,
  );

  let response: Response;
  try {
    response = await fetch(target, {
      headers: { 'Accept-Language': 'es' },
    });
  } catch {
    throw createError({
      statusCode: 502,
      message: 'No se pudo conectar con el generador de PDF',
    });
  }

  if (!response.ok) {
    throw createError({
      statusCode: response.status,
      message: 'No se pudo generar la cotización',
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
});
