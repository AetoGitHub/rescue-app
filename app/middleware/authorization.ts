export default defineNuxtRouteMiddleware(async (to) => {
  const { user } = useUserSession();

  if (isUnauthorizedRole(user.value?.role)) {
    return navigateTo('/unauthorized');
  }

  const ability = abilityForAdminPath(to.path);

  if (await denies(ability)) {
    return navigateTo(defaultHomeForRole(user.value?.role));
  }
});
