# Aprende rescue-app — guía interactiva

Mini proyecto autocontenido (HTML + CSS + JS plano, sin build ni `npm install`) para aprender el stack de `rescue-app` (Nuxt 4, Vue 3, TypeScript, Pinia Colada, Zod, Nuxt UI/Tailwind, y el patrón BFF hacia Django) viniendo de un perfil backend de Django.

## Cómo abrirlo

Opción 1 — doble clic:

Abre `learn/index.html` directo en tu navegador.

Opción 2 — servidor estático (recomendado si tu navegador bloquea algo bajo `file://`):

```bash
cd learn
python -m http.server 8080
# abre http://localhost:8080
```

Tu progreso (módulos completados, resultados de quiz, tema claro/oscuro, último módulo visitado) se guarda en `localStorage` de tu navegador — nada se envía a ningún servidor.

## Cómo está organizado

```
learn/
  index.html, styles.css, app.js   -> shell de la app
  js/                              -> motor: store, router, sidebar, render,
                                      quiz, playground, type-exercise, highlight
  content/NN-slug.js               -> un archivo por módulo, se auto-registra
                                      en window.LearnContent[id]
```

Todo el JS son *scripts clásicos* (sin `type="module"`), a propósito: los módulos ES no funcionan bajo `file://` por las restricciones de CORS del navegador. Vue 3 se carga desde CDN (build global, expone `window.Vue`) para que el "code playground" pueda ejecutar componentes de Vue reales sin ningún paso de build.

## Cómo agregar o editar un módulo

1. Crea (o edita) un archivo en `content/`, por ejemplo `content/15-mi-modulo.js` (el número del nombre es solo para ordenar visualmente los archivos en el disco — el orden real en el sidebar lo controla `LEARN_MODULE_ORDER`, ver paso 3):

```js
(function () {
  const { codeBlock, calloutTip, calloutWarning, djangoVsVue } = window.Learn;

  window.LearnContent = window.LearnContent || {};
  window.LearnContent['mi-modulo'] = {
    id: 'mi-modulo',
    title: 'Mi módulo',
    icon: '✨',
    estimatedMinutes: 8,
    sections: [
      { heading: 'Un tema', bodyHtml: codeBlock('ts', `const x = 1;`) },
    ],
    quiz: { passThreshold: 0.7, questions: [ /* ver otros módulos como ejemplo */ ] },
    playground: { starterCode: `/* ... */`, solutionCode: `/* ... */` },
  };
})();
```

2. Agrega el `<script src="content/15-mi-modulo.js"></script>` en `index.html`, **antes** de `content/index.js`.
3. Agrega `'mi-modulo'` a `window.LEARN_MODULE_ORDER` en `content/index.js`, en la posición donde quieras que aparezca en el sidebar.

Los helpers disponibles en `window.Learn` para armar `bodyHtml` son: `codeBlock(lang, code)`, `calloutTip(html)`, `calloutWarning(html)`, `djangoVsVue({ django, vue, note? })`.

Para un ejercicio de TypeScript sin ejecución (tipo "completa y compara"), usa `typeExercise: { prompt, starterCode, solutionCode }` en vez de (o además de) `playground`.

## Decisiones de diseño a tener en cuenta

- **El code playground no usa iframe.** El contenido es de un único autor de confianza (esta guía), así que se monta directo en un `<div>` de la página. Si algún día esta guía se publica para que terceros no confiables editen o compartan snippets, ahí sí conviene migrar a un iframe con `sandbox`.
- **Pinia Colada y Zod no se cargan reales en el playground** (no publican un build UMD/global listo para `<script>` clásico) — se usan implementaciones "mini" caseras con la misma forma de API. Siempre se aclara en el texto cuál es la librería real que usa el proyecto.
- El módulo de Nuxt UI + Tailwind es el único que inyecta Tailwind vía CDN, y solo dentro de su propio playground, para no mezclar la identidad visual de la guía con el objeto de estudio.
