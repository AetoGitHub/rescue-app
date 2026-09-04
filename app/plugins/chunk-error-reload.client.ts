/**
 * Every deploy replaces the built assets in place (no CDN/old-build retention),
 * so a tab left open across a deploy can still hold references to chunk hashes
 * that no longer exist on the server. Nuxt's built-in recovery only reloads on
 * route-navigation chunk failures; it doesn't cover Lazy* components (modals,
 * panels) mounted outside of router navigation, which this app uses heavily.
 *
 * Strategy: reload as soon as it's safe to do so without disrupting the user —
 * the next time the tab is hidden (they switched away or minimized), not mid-use.
 * `app:manifest:update` fires proactively (Nuxt polls for new deploys in the
 * background, before anything has broken) so most users self-heal silently and
 * never see anything. `app:chunkError` is the reactive fallback for when a
 * dynamic import already failed; it also shows a toast so the user isn't left
 * wondering why the click did nothing.
 */
export default defineNuxtPlugin((nuxtApp) => {
  let reloadPending = false;

  function reloadNow() {
    reloadNuxtApp({ force: true, persistState: true });
  }

  function onHidden() {
    if (document.visibilityState !== 'hidden') return;
    document.removeEventListener('visibilitychange', onHidden);
    reloadNow();
  }

  function scheduleReload() {
    if (reloadPending) return;
    reloadPending = true;

    if (document.visibilityState === 'hidden') {
      reloadNow();
      return;
    }
    document.addEventListener('visibilitychange', onHidden);
  }

  nuxtApp.hook('app:manifest:update', () => {
    scheduleReload();
  });

  nuxtApp.hook('app:chunkError', () => {
    scheduleReload();

    const toast = useToast();
    toast.add({
      id: 'chunk-error-reload',
      title: 'Hay una nueva versión disponible',
      description:
        'La aplicación se actualizará sola la próxima vez que cambies de pestaña. Si prefieres, recarga ahora.',
      icon: 'i-lucide-refresh-cw',
      color: 'warning',
      duration: 0,
      actions: [
        {
          label: 'Recargar ahora',
          onClick: reloadNow,
        },
      ],
    });
  });
});
