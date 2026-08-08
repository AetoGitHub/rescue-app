import { joinURL } from 'ufo';
import * as Sentry from '@sentry/nuxt';
import { abilityForApiPath } from '#shared/utils/admin-api-access';
import { parseRescueGuestIdParam } from '../../../utils/rescue-guest-api';

/**
 * Dedicated proxy for claim so the Django trailing slash is never lost
 * (catch-all `event.path` can arrive without it → upstream 404 on POST).
 */
export default defineEventHandler(async (event) => {
  const rescueId = parseRescueGuestIdParam(getRouterParam(event, 'id'));
  if (rescueId == null) {
    throw createError({
      statusCode: 400,
      message: 'Rescate no válido',
    });
  }

  const session = await requireUserSession(event);
  const token = session?.token;
  const apiUrl = useRuntimeConfig().apiUrl?.trim() ?? '';

  if (!apiUrl) {
    Sentry.captureMessage('NUXT_API_URL / runtimeConfig.apiUrl is empty on claim proxy', {
      level: 'error',
      tags: { proxy: 'rescue_claim' },
      extra: { path: event.path, method: event.method, rescueId },
    });
    throw createError({
      statusCode: 500,
      message: 'API upstream no configurada',
    });
  }

  await authorize(event, abilityForApiPath(event.path));

  const target = joinURL(apiUrl, `/api/rescue/claim/${rescueId}/`);

  Sentry.addBreadcrumb({
    category: 'api.proxy',
    message: 'Proxying rescue claim',
    level: 'info',
    data: {
      path: event.path,
      method: event.method,
      target,
      rescueId,
    },
  });

  try {
    return await proxyRequest(event, target, {
      headers: {
        Authorization: `Token ${token}`,
        'Accept-Language': 'es',
      },
      async onResponse(_event, response) {
        if (response.status >= 400) {
          let bodyPreview: string | undefined;
          try {
            bodyPreview = (await response.clone().text()).slice(0, 500);
          } catch {
            bodyPreview = undefined;
          }

          Sentry.captureMessage(
            `Rescue claim upstream ${response.status}`,
            {
              level: response.status >= 500 ? 'error' : 'warning',
              tags: {
                proxy: 'rescue_claim',
                upstream_status: String(response.status),
              },
              extra: {
                path: event.path,
                method: event.method,
                target,
                rescueId,
                upstreamStatus: response.status,
                upstreamStatusText: response.statusText,
                bodyPreview,
              },
            },
          );
        }
      },
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { proxy: 'rescue_claim' },
      extra: {
        path: event.path,
        method: event.method,
        target,
        rescueId,
      },
    });
    throw error;
  }
});
