export default defineNuxtRouteMiddleware(async (to) => {
  const { user } = useUserSession();

  const ability = abilityForAdminPath(to.path);

  if (await denies(ability)) {
    return navigateTo(defaultHomeForRole(user.value?.role));
  }
});
