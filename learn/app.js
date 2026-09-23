(function () {
  function initTheme() {
    const saved = window.Learn.store.getTheme();
    const theme = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);

    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        window.Learn.store.setTheme(next);
      });
    }
  }

  function initMobileSidebar() {
    const toggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    if (!toggle || !sidebar) return;

    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('is-open');
    });

    document.addEventListener('click', (e) => {
      const clickedInsideSidebar = sidebar.contains(e.target);
      const clickedToggle = toggle.contains(e.target);
      if (sidebar.classList.contains('is-open') && !clickedInsideSidebar && !clickedToggle) {
        sidebar.classList.remove('is-open');
      }
    });
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise((resolve, reject) => {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  }

  function initCopyButtons() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-copy]');
      if (!btn) return;
      const block = btn.closest('.code-block');
      const codeEl = block ? block.querySelector('code') : null;
      if (!codeEl) return;

      copyText(codeEl.textContent)
        .then(() => {
          const original = btn.textContent;
          btn.textContent = '¡Copiado!';
          setTimeout(() => {
            btn.textContent = original;
          }, 1500);
        })
        .catch(() => {
          btn.textContent = 'Error al copiar';
        });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initMobileSidebar();
    initCopyButtons();
    window.Learn.router.initRouter();
  });
})();
