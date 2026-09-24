import { accessClientPortal } from '#shared/abilities';

export default defineNuxtRouteMiddleware(async () => {
  if (await denies(accessClientPortal)) {
    const { user } = useUserSession();
    return navigateTo(defaultHomeForRole(user.value?.role));
  }
});
