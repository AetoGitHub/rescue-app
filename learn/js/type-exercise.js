(function () {
  // TypeScript no se puede ejecutar en el navegador sin un paso de build (no
  // hay bundler aquí). En vez de un playground ejecutable, este ejercicio
  // compara el tipo que escribe el alumno contra una solución esperada
  // (comparación de texto normalizado) — honesto sobre la limitación.
  function normalize(str) {
    return str.replace(/\s+/g, ' ').trim();
  }

  function mountTypeExercise(container, exercise) {
    if (!container || !exercise) return;

    container.innerHTML = `
      <div class="playground">
        <div class="playground-header">
          <h2>Completa el tipo</h2>
          <div class="playground-actions">
            <button type="button" class="btn btn-primary" data-action="check">Revisar</button>
            <button type="button" class="btn btn-ghost" data-action="reset">↺ Reiniciar</button>
            ${exercise.solutionCode ? '<button type="button" class="btn btn-ghost" data-action="solution">Ver solución</button>' : ''}
          </div>
        </div>
        <div class="type-exercise-body">
          <p class="pg-output-label">${exercise.prompt}</p>
          <textarea class="pg-editor type-editor" spellcheck="false" aria-label="Editor de tipos"></textarea>
          <div class="quiz-result" hidden></div>
        </div>
      </div>
    `;

    const editor = container.querySelector('.type-editor');
    const resultEl = container.querySelector('.quiz-result');
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

    container.querySelector('[data-action="check"]').addEventListener('click', () => {
      const isCorrect = normalize(editor.value) === normalize(exercise.solutionCode);
      resultEl.hidden = false;
      resultEl.textContent = isCorrect
        ? '✓ Coincide con la solución esperada.'
        : 'Todavía no coincide exactamente. Revisa signos de puntuación, ? de opcionales y uniones con |.';
      resultEl.className = `quiz-result ${isCorrect ? 'quiz-passed' : 'quiz-failed'}`;
    });

    container.querySelector('[data-action="reset"]').addEventListener('click', () => {
      editor.value = exercise.starterCode.trim();
      resultEl.hidden = true;
    });

    const solutionBtn = container.querySelector('[data-action="solution"]');
    if (solutionBtn) {
      solutionBtn.addEventListener('click', () => {
        editor.value = exercise.solutionCode.trim();
        resultEl.hidden = true;
      });
    }
  }

  window.Learn = window.Learn || {};
  window.Learn.typeExercise = { mountTypeExercise };
})();
