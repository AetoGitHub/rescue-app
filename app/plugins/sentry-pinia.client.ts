import * as Sentry from '@sentry/nuxt';

export default defineNuxtPlugin(() => {
  Sentry.addIntegration(
    Sentry.piniaIntegration(usePinia(), {
      attachPiniaState: true,
      addBreadcrumbs: true,
    }),
  );

  const { user } = useUserSession();
  watch(
    user,
    (current) => {
      if (current?.id == null) {
        Sentry.setUser(null);
        Sentry.setTag('user_role', undefined);
        return;
      }
      Sentry.setUser({
        id: String(current.id),
        username: current.name,
      });
      Sentry.setTag('user_role', current.role);
    },
    { immediate: true },
  );
});

