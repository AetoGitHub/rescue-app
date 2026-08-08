import * as Sentry from '@sentry/nuxt';

export default defineNuxtPlugin(() => {
  Sentry.addIntegration(
    Sentry.piniaIntegration(usePinia(), {
      attachPiniaState: true,
      addBreadcrumbs: true,
    }),
  );
});
