(function () {
  let lastActiveModuleId = null;

  function totalModules() {
    return window.LEARN_MODULE_ORDER.length;
  }

  function completedCount() {
    const state = window.Learn.store.getAllState();
    return Object.keys(state.completedModules).filter((k) => state.completedModules[k]).length;
  }

  function render(activeModuleId) {
    lastActiveModuleId = activeModuleId;

    const nav = document.getElementById('sidebar-nav');
    if (!nav) return;

    const total = totalModules();
    const done = completedCount();
    const pct = total ? Math.round((done / total) * 100) : 0;

    const progressBar = document.getElementById('global-progress-bar');
    const progressLabel = document.getElementById('global-progress-label');
    if (progressBar) progressBar.style.width = `${pct}%`;
    if (progressLabel) progressLabel.textContent = `${done}/${total} módulos — ${pct}%`;

    const esc = window.Learn.escapeHtml;
    let html = '';

    window.LEARN_MODULE_ORDER.forEach((moduleId) => {
      const mod = window.LearnContent[moduleId];
      if (!mod) return;

      const isActive = moduleId === activeModuleId;
      const isComplete = window.Learn.store.isModuleComplete(moduleId);
      const quizResult = window.Learn.store.getQuizResult(moduleId);

      let badge = '';
      if (quizResult) {
        badge = quizResult.passed
          ? '<span class="badge badge-success">✓</span>'
          : `<span class="badge badge-warning">${quizResult.score}/${quizResult.total}</span>`;
      }

      html += `
        <a href="#/${moduleId}" class="sidebar-link${isActive ? ' is-active' : ''}"${
        isActive ? ' aria-current="page"' : ''
      }>
          <span class="sidebar-check">${isComplete ? '✓' : ''}</span>
          <span class="sidebar-icon" aria-hidden="true">${mod.icon}</span>
          <span class="sidebar-label">${esc(mod.title)}</span>
          ${badge}
        </a>
      `;
    });

    nav.innerHTML = html;

    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.remove('is-open');
  }

  function refresh() {
    render(lastActiveModuleId);
  }

  window.Learn = window.Learn || {};
  window.Learn.sidebar = { render, refresh };
})();
