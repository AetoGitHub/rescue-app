import * as Sentry from '@sentry/nuxt';

Sentry.init({
  dsn: "https://79a340de15142d97c63e10fc06f8af64@o4509453945798656.ingest.us.sentry.io/4511872246808576",
  tunnel: "/tunnel",

  tracesSampleRate: 0.1,
  tracePropagationTargets: ['localhost', /^\//],

  integrations: [
    Sentry.browserTracingIntegration(),
  ],
});
