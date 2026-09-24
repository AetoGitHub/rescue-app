/**
 * Denegado por defecto para el rol `client`: fuera de las páginas listadas en
 * `shared/utils/client-access.ts`, cualquier ruta lo regresa a su portal,
 * aunque la escriba a mano en la URL.
 */
export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn, user } = useUserSession();

  if (!loggedIn.value || !isClientRole(user.value?.role)) return;
  if (isClientPageAllowed(to.path)) return;

  return navigateTo(CLIENT_HOME, { replace: true });
});
