/**
 * Si una llamada a `/api/**` responde 401 mientras hay sesión en el panel
 * (admin o portal cliente), la sesión ya no sirve: el refresh falló o Django
 * rechazó el token. En lugar de mostrar "Tu sesión expiró" en cada pantalla,
 * se limpia la sesión y se manda directo al login.
 *
 * 403 no cuenta: es falta de permisos, no sesión vencida.
 */
const LOGGED_IN_AREAS = ['/admin', '/portal-cliente'];
const IGNORED_API_PATHS = ['/api/auth/login', '/api/auth/logout', '/api/_auth/session'];

function requestPath(request: unknown): string {
  const raw = typeof request === 'string'
    ? request
    : request instanceof Request
      ? request.url
      : '';
  try {
    return new URL(raw, window.location.origin).pathname;
  } catch {
    return raw;
  }
}

export default defineNuxtPlugin(() => {
  const { loggedIn, clear } = useUserSession();
  let loggingOut = false;

  async function logoutToLogin() {
    if (loggingOut) return;
    loggingOut = true;
    try {
      await clear();
    } catch {
      // Aunque falle limpiar la cookie, el login pedirá credenciales de nuevo.
    }
    // Recarga completa para no dejar en memoria datos del usuario anterior.
    window.location.replace('/login');
  }

  function shouldLogout(request: unknown, status: number | undefined): boolean {
    if (status !== 401 || loggingOut || !loggedIn.value) return false;

    const currentPath = window.location.pathname;
    if (!LOGGED_IN_AREAS.some((area) => currentPath.startsWith(area))) return false;

    const path = requestPath(request);
    if (!path.startsWith('/api/')) return false;
    return !IGNORED_API_PATHS.some((ignored) => path.startsWith(ignored));
  }

  globalThis.$fetch = globalThis.$fetch.create({
    onResponseError({ request, response }) {
      if (shouldLogout(request, response.status)) {
        void logoutToLogin();
      }
    },
  });
});
