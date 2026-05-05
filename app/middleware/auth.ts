export default defineNuxtRouteMiddleware(() => {
  const { loggedIn } = useUserSession();

  console.log('loggedIn', loggedIn.value);
  if (!loggedIn.value) return navigateTo('/login');
});
