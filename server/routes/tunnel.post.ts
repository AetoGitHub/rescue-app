import { handleTunnelRequest } from '@sentry/core';

/** Must match the DSN in sentry.client.config.ts / sentry.server.config.ts */
const ALLOWED_DSNS = [
  'https://8e300f1d1a565f5f77d14e8a2d49bf67@o4509453945798656.ingest.us.sentry.io/4511872253755392',
];

/**
 * Proxies browser Sentry envelopes to ingest so ad blockers do not drop events.
 * Paired with `tunnel: "/tunnel"` in sentry.client.config.ts.
 */
export default defineEventHandler(async (event) => {
  return handleTunnelRequest({
    request: toWebRequest(event),
    allowedDsns: ALLOWED_DSNS,
  });
});
