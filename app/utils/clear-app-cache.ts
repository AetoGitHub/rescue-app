/**
 * Borra la caché del navegador para esta app (Cache Storage y service workers)
 * y recarga la página para pedir la versión más reciente.
 * No toca cookies ni storage: la sesión y las preferencias se conservan.
 */
export async function clearAppCacheAndReload(): Promise<void> {
  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }
  } finally {
    window.location.reload();
  }
}
