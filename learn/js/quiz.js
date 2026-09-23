(function () {
  function renderQuiz(container, quizDef, moduleId, onGraded) {
    if (!container) return;

    const esc = window.Learn.escapeHtml;
    let selected = new Array(quizDef.questions.length).fill(null);
    let graded = false;

    function render() {
      let html = '<div class="quiz-block"><h2>Ponte a prueba</h2>';

      quizDef.questions.forEach((q, qi) => {
        html += `<fieldset class="quiz-question" role="radiogroup" aria-label="${esc(q.question)}">`;
        html += `<legend>${qi + 1}. ${esc(q.question)}</legend>`;
        q.options.forEach((opt, oi) => {
          let state = '';
          if (graded) {
            if (oi === q.correctIndex) state = ' is-correct';
            else if (oi === selected[qi]) state = ' is-incorrect';
          } else if (selected[qi] === oi) {
            state = ' is-selected';
          }
          html += `<button type="button" class="quiz-option${state}" data-qi="${qi}" data-oi="${oi}"${
            graded ? ' disabled' : ''
          }>${esc(opt)}</button>`;
        });
        if (graded && q.explanation) {
          html += `<p class="quiz-explanation">${esc(q.explanation)}</p>`;
        }
        html += '</fieldset>';
      });

      if (!graded) {
        const allAnswered = selected.every((v) => v !== null);
        html += `<button type="button" id="quiz-submit" class="btn btn-primary"${
          allAnswered ? '' : ' disabled'
        }>Enviar respuestas</button>`;
      } else {
        html += '<div class="quiz-result" id="quiz-result"></div>';
        html += '<button type="button" id="quiz-retry" class="btn btn-ghost">Reintentar</button>';
      }

      html += '</div>';
      container.innerHTML = html;
      bind();
    }

    function bind() {
      if (!graded) {
        container.querySelectorAll('.quiz-option').forEach((btn) => {
          btn.addEventListener('click', () => {
            const qi = Number(btn.getAttribute('data-qi'));
            const oi = Number(btn.getAttribute('data-oi'));
            selected[qi] = oi;
            render();
          });
        });
        const submitBtn = container.querySelector('#quiz-submit');
        if (submitBtn) submitBtn.addEventListener('click', grade);
      } else {
        const retryBtn = container.querySelector('#quiz-retry');
        if (retryBtn) {
          retryBtn.addEventListener('click', () => {
            graded = false;
            selected = new Array(quizDef.questions.length).fill(null);
            render();
          });
        }
        const resultEl = container.querySelector('#quiz-result');
        if (resultEl) {
          const result = window.Learn.store.getQuizResult(moduleId);
          if (result) {
            resultEl.textContent = `Resultado: ${result.score}/${result.total}${
              result.passed ? ' — ¡Aprobado!' : ' — Sigue practicando'
            }`;
            resultEl.className = `quiz-result ${result.passed ? 'quiz-passed' : 'quiz-failed'}`;
          }
        }
      }
    }

    function grade() {
      let score = 0;
      quizDef.questions.forEach((q, qi) => {
        if (selected[qi] === q.correctIndex) score += 1;
      });
      const total = quizDef.questions.length;
      const passed = score / total >= (quizDef.passThreshold || 0.7);
      const result = { score, total, passed, answeredAt: Date.now() };

      window.Learn.store.saveQuizResult(moduleId, result);
      window.Learn.store.markModuleComplete(moduleId);
      graded = true;
      render();

      if (typeof onGraded === 'function') onGraded(result);
    }

    render();
  }

  window.Learn = window.Learn || {};
  window.Learn.quiz = { renderQuiz };
})();
