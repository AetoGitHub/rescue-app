import { joinURL, withTrailingSlash } from 'ufo';
import * as Sentry from '@sentry/nuxt';
import { abilityForApiPath } from '#shared/utils/admin-api-access';

/**
 * Django expects trailing slashes; Nitro may normalize `event.path` without one.
 * POSTs without `/` typically 404 instead of redirecting.
 */
function djangoApiPath(path: string): string {
  return withTrailingSlash(path);
}

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  const token = session?.token;
  const apiUrl = useRuntimeConfig().apiUrl?.trim() ?? '';
  const path = event.path;
  const method = event.method;

  if (!apiUrl) {
    Sentry.captureMessage('NUXT_API_URL / runtimeConfig.apiUrl is empty on API proxy', {
      level: 'error',
      tags: { proxy: 'api_catch_all' },
      extra: { path, method },
    });
    throw createError({
      statusCode: 500,
      message: 'API upstream no configurada',
    });
  }

  await authorize(event, abilityForApiPath(path));

  const target = joinURL(apiUrl, djangoApiPath(path));

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

          Sentry.captureMessage(`API proxy upstream ${response.status}`, {
            level: response.status >= 500 ? 'error' : 'warning',
            tags: {
              proxy: 'api_catch_all',
              upstream_status: String(response.status),
            },
            extra: {
              path,
              method,
              target,
              upstreamStatus: response.status,
              upstreamStatusText: response.statusText,
              bodyPreview,
            },
          });
        }
      },
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { proxy: 'api_catch_all' },
      extra: { path, method, target },
    });
    throw error;
  }
});
