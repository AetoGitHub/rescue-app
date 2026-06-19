export default defineNuxtRouteMiddleware((to) => {
  if (to.path !== '/') return;

  const { loggedIn, user } = useUserSession();

  if (loggedIn.value) {
    return navigateTo(defaultHomeForRole(user.value?.role));
  }

  return navigateTo('/admin/operational');
});
