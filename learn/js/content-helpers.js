(function () {
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function codeBlock(lang, code) {
    const trimmed = code.replace(/^\n/, '').replace(/\s+$/, '');
    const highlighted = window.Learn.highlight
      ? window.Learn.highlight(trimmed, lang)
      : escapeHtml(trimmed);
    return `
      <div class="code-block" data-lang="${escapeHtml(lang)}">
        <div class="code-block-header">
          <span class="code-lang">${escapeHtml(lang)}</span>
          <button type="button" class="copy-btn" data-copy>Copiar</button>
        </div>
        <pre><code>${highlighted}</code></pre>
      </div>
    `;
  }

  function callout(type, icon, html) {
    return `
      <div class="callout callout-${type}">
        <span class="callout-icon" aria-hidden="true">${icon}</span>
        <div class="callout-body">${html}</div>
      </div>
    `;
  }

  function calloutTip(html) {
    return callout('tip', '💡', html);
  }

  function calloutWarning(html) {
    return callout('warning', '⚠️', html);
  }

  function djangoVsVue(opts) {
    return `
      <div class="compare-grid">
        <div class="compare-col compare-django">
          <h4>Django (lo que ya conoces)</h4>
          ${opts.django}
        </div>
        <div class="compare-col compare-vue">
          <h4>Nuxt / Vue (este proyecto)</h4>
          ${opts.vue}
        </div>
      </div>
      ${opts.note ? `<p class="compare-note">${opts.note}</p>` : ''}
    `;
  }

  window.Learn = window.Learn || {};
  window.Learn.escapeHtml = escapeHtml;
  window.Learn.codeBlock = codeBlock;
  window.Learn.calloutTip = calloutTip;
  window.Learn.calloutWarning = calloutWarning;
  window.Learn.djangoVsVue = djangoVsVue;
})();
