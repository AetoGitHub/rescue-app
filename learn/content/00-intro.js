(function () {
  const { calloutTip, djangoVsVue } = window.Learn;

  window.LearnContent = window.LearnContent || {};
  window.LearnContent['intro'] = {
    id: 'intro',
    title: 'Bienvenida y mapa mental',
    icon: '🗺️',
    estimatedMinutes: 6,
    sections: [
      {
        heading: '¿Por qué esta guía?',
        bodyHtml: `
          <p>
            Vienes del backend con Django y ahora te toca mantener <strong>rescue-app</strong>,
            un frontend construido con <strong>Nuxt 4</strong> sobre <strong>Vue 3</strong> y
            <strong>TypeScript</strong>. No es un proyecto de juguete: tiene ~110 composables,
            decenas de páginas, formularios validados, autenticación por sesión, y un backend
            propio (<code>server/</code>) que actúa de puente hacia tu API de Django real.
          </p>
          <p>
            Esta guía no te enseña "JS en general": te enseña <strong>lo que este repo usa,
            con ejemplos sacados o adaptados de su propio código</strong>, en el orden en que
            necesitas aprenderlo para poder leer un archivo, entender qué hace, y modificarlo
            con confianza. Cada módulo tiene un mini-quiz y, en la mayoría, un playground donde
            ejecutas código de verdad en el navegador.
          </p>
          ${calloutTip('Puedes usar IA para escribir código — de hecho aquí construimos un playground con Vue real para que experimentes. Pero la meta de esta guía es que entiendas <em>por qué</em> el código hace lo que hace, no solo que lo generes.')}
        `,
      },
      {
        heading: 'El mapa mental: Django → Nuxt/Vue',
        bodyHtml: `
          <p>Antes de entrar en detalle, aquí tienes el "diccionario" que vas a usar en cada módulo siguiente:</p>
          <table>
            <thead><tr><th>En Django ya conoces...</th><th>En rescue-app es...</th></tr></thead>
            <tbody>
              <tr><td><code>urls.py</code></td><td>Rutas por archivo en <code>app/pages/</code> (módulo 5)</td></tr>
              <tr><td>Vistas (<code>views.py</code>)</td><td>Páginas <code>.vue</code> + composables (<code>app/composables/</code>, módulo 6)</td></tr>
              <tr><td>Templates Django / Jinja</td><td>Componentes de un solo archivo <code>.vue</code> (módulo 4)</td></tr>
              <tr><td>Forms / DRF serializers</td><td>Esquemas Zod (<code>app/schemas/</code>, módulo 8)</td></tr>
              <tr><td><code>settings.py</code></td><td><code>nuxt.config.ts</code></td></tr>
              <tr><td><code>manage.py runserver</code></td><td><code>pnpm dev</code></td></tr>
              <tr><td><code>requirements.txt</code> / pip</td><td><code>package.json</code> / pnpm</td></tr>
              <tr><td><code>LoginRequiredMixin</code></td><td>Middleware <code>app/middleware/auth.ts</code> (módulo 11)</td></tr>
              <tr><td>Caché de queryset / <code>cache.set</code></td><td>Pinia Colada: cache + invalidación (módulo 7)</td></tr>
              <tr><td>Tu API REST (DRF, <code>TokenAuthentication</code>)</td><td>El mismo backend, ahora detrás de un proxy Nuxt (módulo 10 — el más importante para ti)</td></tr>
            </tbody>
          </table>
        `,
      },
      {
        heading: 'El dato más importante desde ya',
        bodyHtml: `
          ${djangoVsVue({
            django: '<p>El navegador llama directo a tu API Django (o a través de un reverse proxy tipo nginx que no le agrega lógica de negocio).</p>',
            vue: '<p>El navegador <strong>nunca</strong> llama a Django directamente. Llama a <code>server/api/</code> dentro de este mismo proyecto Nuxt, que valida la sesión, agrega el header <code>Authorization: Token …</code> y recién ahí reenvía la petición a tu Django real.</p>',
            note: 'Esto se llama patrón BFF (Backend-For-Frontend) y le dedicamos el módulo 10 completo — es la pieza que más te va a sorprender viniendo de Django puro.',
          })}
        `,
      },
      {
        heading: 'Cómo recorrer esta guía',
        bodyHtml: `
          <ol>
            <li>Sigue el orden del menú lateral: cada módulo construye sobre el anterior.</li>
            <li>El módulo 1 te ayuda a levantar el proyecto en tu máquina — hazlo primero si todavía no lo tienes corriendo.</li>
            <li>Los módulos 2-3 son un repaso rápido de JS/TS moderno — si ya te sientes cómodo, avanza rápido, pero no te lo saltes del todo: hay convenciones específicas de este repo.</li>
            <li>Los módulos 4-9 son el corazón de Vue/Nuxt y sus librerías.</li>
            <li>El módulo 10 es el puente conceptual más importante para ti como backend dev.</li>
            <li>El módulo "Cookbook" (casi al final) junta todo lo anterior en tareas prácticas de mantenimiento: agregar un modal, un campo a un formulario, o una página de catálogo nueva.</li>
            <li>El último módulo te enseña a pedirle bien cambios a la IA para este proyecto específico, con plantillas de prompt listas para usar.</li>
            <li>Tu progreso se guarda automáticamente en este navegador (localStorage) — puedes cerrar y volver cuando quieras.</li>
          </ol>
        `,
      },
    ],
  };
})();
