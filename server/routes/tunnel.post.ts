import { handleTunnelRequest } from '@sentry/core';

/** Must match the DSN in sentry.client.config.ts / sentry.server.config.ts */
const ALLOWED_DSNS = [
  'https://79a340de15142d97c63e10fc06f8af64@o4509453945798656.ingest.us.sentry.io/4511872246808576',
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
