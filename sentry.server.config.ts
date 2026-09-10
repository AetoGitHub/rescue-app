import * as Sentry from "@sentry/nuxt";
 
Sentry.init({
  dsn: "https://8e300f1d1a565f5f77d14e8a2d49bf67@o4509453945798656.ingest.us.sentry.io/4511872253755392",

  // 1.0 traceaba (y potencialmente capturaba el body de) cada request al
  // proxy de Django, agregando latencia perceptible al endpoint de cards.
  tracesSampleRate: 0.2,

  dataCollection: {
    // Sin esto, Sentry serializa el body completo de cada request/response
    // proxeada a Django para adjuntarlo al trace — costoso en endpoints
    // como cards/?status=closed que regresan varias decenas de rescates.
    httpBodies: [],
  },

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});
