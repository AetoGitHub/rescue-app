(function () {
  function parseHash() {
    return window.location.hash.replace(/^#\/?/, '').split('/')[0] || null;
  }

  function resolveDefault() {
    const last = window.Learn.store.getLastVisited();
    if (last && window.LearnContent[last]) return last;
    return window.LEARN_MODULE_ORDER[0];
  }

  function handleRoute() {
    let moduleId = parseHash();
    let moduleDef = moduleId ? window.LearnContent[moduleId] : null;

    if (!moduleDef) {
      moduleId = resolveDefault();
      window.location.hash = `#/${moduleId}`;
      return; // el cambio de hash vuelve a disparar handleRoute
    }

    window.Learn.store.setLastVisited(moduleId);
    window.Learn.renderModule(moduleDef);
    window.Learn.sidebar.render(moduleId);
  }

  function navigateTo(moduleId) {
    window.location.hash = `#/${moduleId}`;
  }

  function initRouter() {
    window.addEventListener('hashchange', handleRoute);
    handleRoute();
  }

  window.Learn = window.Learn || {};
  window.Learn.router = { initRouter, navigateTo };
})();
