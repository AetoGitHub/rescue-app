import * as Sentry from "@sentry/nuxt";
 
Sentry.init({
  dsn: "https://8e300f1d1a565f5f77d14e8a2d49bf67@o4509453945798656.ingest.us.sentry.io/4511872253755392",

  // We recommend adjusting this value in production, or using tracesSampler
  // for finer control
  tracesSampleRate: 1.0,

  dataCollection: {
    // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/nuxt/configuration/options/#dataCollection
    // userInfo: false,
    // httpBodies: [],
  },

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});
