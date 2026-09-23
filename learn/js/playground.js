(function () {
  // Motor único del "code playground": ejecuta snippets de Vue 3 reales
  // (cargado vía CDN) directo en un <div> de la página. Sin iframe: el
  // contenido es de un único autor de confianza (esta guía), así que el
  // aislamiento de un iframe no aporta beneficio real aquí. Si esta guía se
  // publicara algún día para terceros no confiables, ahí sí valdría migrar a
  // un iframe con `sandbox`.
  const mountedApps = new WeakMap();
  let activeOutputEl = null;
  let activeErrorEl = null;

  function showError(errorEl, err) {
    if (!errorEl) return;
    errorEl.hidden = false;
    errorEl.textContent = err && err.message ? err.message : String(err);
  }

  // Errores asíncronos (p. ej. dentro de onMounted) no los captura el
  // try/catch síncrono de run(); los enrutamos al panel activo.
  window.addEventListener('error', (e) => {
    if (activeErrorEl) showError(activeErrorEl, e.error || e.message);
  });
  window.addEventListener('unhandledrejection', (e) => {
    if (activeErrorEl) showError(activeErrorEl, e.reason);
  });

  function mountPlayground(container, exercise) {
    if (!container || !exercise) return;

    container.innerHTML = `
      <div class="playground">
        <div class="playground-header">
          <h2>Playground</h2>
          <div class="playground-actions">
            <button type="button" class="btn btn-primary" data-action="run">▶ Ejecutar</button>
            <button type="button" class="btn btn-ghost" data-action="reset">↺ Reiniciar</button>
            ${exercise.solutionCode ? '<button type="button" class="btn btn-ghost" data-action="solution">Ver solución</button>' : ''}
          </div>
        </div>
        <div class="playground-body">
          <textarea class="pg-editor" spellcheck="false" aria-label="Editor de código"></textarea>
          <div class="pg-output-wrap">
            <p class="pg-output-label">Resultado</p>
            <div class="pg-output"></div>
            <pre class="pg-error" hidden></pre>
          </div>
        </div>
      </div>
    `;

    const editor = container.querySelector('.pg-editor');
    const output = container.querySelector('.pg-output');
    const errorEl = container.querySelector('.pg-error');

    editor.value = exercise.starterCode.trim();

    editor.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        editor.value = editor.value.slice(0, start) + '  ' + editor.value.slice(end);
        editor.selectionStart = editor.selectionEnd = start + 2;
      }
    });

    function run() {
      activeOutputEl = output;
      activeErrorEl = errorEl;

      const prevApp = mountedApps.get(output);
      if (prevApp) {
        try {
          prevApp.unmount();
        } catch (e) {
          // ya desmontada o nunca llegó a montarse del todo: ignorar
        }
        mountedApps.delete(output);
      }

      errorEl.hidden = true;
      errorEl.textContent = '';
      output.innerHTML = '';
      output.__vue_app__ = null;

      try {
        const fn = new Function('Vue', 'mountEl', editor.value);
        fn(window.Vue, output);
        if (output.__vue_app__) {
          output.__vue_app__.config.errorHandler = (err) => showError(errorEl, err);
          mountedApps.set(output, output.__vue_app__);
        }
      } catch (e) {
        showError(errorEl, e);
      }
    }

    container.querySelector('[data-action="run"]').addEventListener('click', run);
    container.querySelector('[data-action="reset"]').addEventListener('click', () => {
      editor.value = exercise.starterCode.trim();
      run();
    });
    const solutionBtn = container.querySelector('[data-action="solution"]');
    if (solutionBtn) {
      solutionBtn.addEventListener('click', () => {
        editor.value = exercise.solutionCode.trim();
        run();
      });
    }

    run();
  }

  window.Learn = window.Learn || {};
  window.Learn.playground = { mountPlayground };
})();
