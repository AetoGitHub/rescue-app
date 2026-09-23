(function () {
  // Resaltado de sintaxis minimalista basado en regex (un solo paso, sin AST).
  // Suficiente para JS/TS/Vue/bash de esta guía; no pretende ser un tokenizer completo.
  const KEYWORDS = [
    'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
    'import', 'export', 'from', 'default', 'class', 'extends', 'new', 'this',
    'typeof', 'instanceof', 'in', 'of', 'try', 'catch', 'finally', 'throw',
    'async', 'await', 'yield', 'switch', 'case', 'break', 'continue', 'null',
    'undefined', 'true', 'false', 'void', 'delete', 'interface', 'type',
    'enum', 'implements', 'public', 'private', 'protected', 'readonly',
    'static', 'as', 'satisfies', 'namespace', 'declare', 'export default',
    'echo', 'then', 'fi', 'do', 'done',
  ];

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // Un único regex con alternativas: comentarios, strings/templates, comentarios
  // HTML, números e identificadores. Se procesa en una sola pasada para no anidar
  // spans (evita el problema de re-resaltar contenido ya envuelto).
  const TOKEN_RE =
    /(\/\/[^\n]*)|(\/\*[\s\S]*?\*\/)|(`(?:\\[\s\S]|[^`\\])*`)|("(?:\\.|[^"\\])*")|('(?:\\.|[^'\\])*')|(&lt;!--[\s\S]*?--&gt;)|(#[^\n]*)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][A-Za-z0-9_$]*)/g;

  function highlight(code, lang) {
    const escaped = escapeHtml(code);
    const isBash = lang === 'bash' || lang === 'sh';

    return escaped.replace(
      TOKEN_RE,
      (match, lineComment, blockComment, template, dq, sq, htmlComment, hashComment, number, ident) => {
        if (lineComment || blockComment || htmlComment) {
          return `<span class="tok-comment">${match}</span>`;
        }
        if (hashComment) {
          return isBash ? `<span class="tok-comment">${match}</span>` : match;
        }
        if (template || dq || sq) {
          return `<span class="tok-string">${match}</span>`;
        }
        if (number) {
          return `<span class="tok-number">${match}</span>`;
        }
        if (ident && KEYWORDS.indexOf(ident) !== -1) {
          return `<span class="tok-keyword">${match}</span>`;
        }
        return match;
      },
    );
  }

  window.Learn = window.Learn || {};
  window.Learn.highlight = highlight;
})();
