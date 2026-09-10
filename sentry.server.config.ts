import * as Sentry from "@sentry/nuxt";
 
Sentry.init({
  dsn: "https://8e300f1d1a565f5f77d14e8a2d49bf67@o4509453945798656.ingest.us.sentry.io/4511872253755392",

  // An empty `dataCollection` block opts into Sentry's full-PII defaults
  // (see below) rather than its conservative ones, so 1.0 traced — and
  // fully serialized the body of — every proxied Django request.
  tracesSampleRate: 0.2,

  dataCollection: {
    // Without this, Sentry serializes the full body of every proxied
    // request/response to attach to the trace.
    httpBodies: [],
  },

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});
