(function () {
  function renderModule(moduleDef) {
    const root = document.getElementById('lesson-content');
    if (!root) return;

    const esc = window.Learn.escapeHtml;
    const isComplete = window.Learn.store.isModuleComplete(moduleDef.id);

    let html = '<div class="content-inner">';
    html += '<div class="lesson-header">';
    html += `<p class="module-eyebrow">${moduleDef.icon} Módulo</p>`;
    html += `<h1>${esc(moduleDef.title)}</h1>`;
    if (moduleDef.estimatedMinutes) {
      html += `<p class="lesson-meta">⏱ ~${moduleDef.estimatedMinutes} min de lectura</p>`;
    }
    html += '</div>';

    moduleDef.sections.forEach((section) => {
      html += '<section class="lesson-section">';
      if (section.heading) html += `<h2>${esc(section.heading)}</h2>`;
      html += section.bodyHtml;
      html += '</section>';
    });

    html += '<div id="module-quiz-slot"></div>';
    html += '<div id="module-playground-slot"></div>';
    html += '<div id="module-type-exercise-slot"></div>';

    html += '<div class="lesson-footer">';
    if (!moduleDef.quiz) {
      html += `<button type="button" id="mark-complete-btn" class="btn ${isComplete ? 'btn-complete' : 'btn-primary'}">${
        isComplete ? '✓ Completado' : 'Marcar como completado'
      }</button>`;
    } else if (isComplete) {
      html += '<p class="lesson-complete-note">✓ Módulo completado</p>';
    }
    html += '</div>';
    html += '</div>';

    root.innerHTML = html;

    if (!moduleDef.quiz) {
      const btn = document.getElementById('mark-complete-btn');
      if (btn) {
        btn.addEventListener('click', () => {
          window.Learn.store.markModuleComplete(moduleDef.id);
          btn.textContent = '✓ Completado';
          btn.classList.remove('btn-primary');
          btn.classList.add('btn-complete');
          window.Learn.sidebar.refresh();
        });
      }
    }

    if (moduleDef.quiz) {
      window.Learn.quiz.renderQuiz(
        document.getElementById('module-quiz-slot'),
        moduleDef.quiz,
        moduleDef.id,
        () => {
          window.Learn.sidebar.refresh();
          const footer = root.querySelector('.lesson-footer');
          if (footer) footer.innerHTML = '<p class="lesson-complete-note">✓ Módulo completado</p>';
        },
      );
    }

    if (moduleDef.playground) {
      window.Learn.playground.mountPlayground(
        document.getElementById('module-playground-slot'),
        moduleDef.playground,
      );
    }

    if (moduleDef.typeExercise) {
      window.Learn.typeExercise.mountTypeExercise(
        document.getElementById('module-type-exercise-slot'),
        moduleDef.typeExercise,
      );
    }

    root.scrollTop = 0;
    window.scrollTo(0, 0);
  }

  window.Learn = window.Learn || {};
  window.Learn.renderModule = renderModule;
})();
