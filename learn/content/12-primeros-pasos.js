(function () {
  const { codeBlock, calloutTip, calloutWarning, djangoVsVue } = window.Learn;

  window.LearnContent = window.LearnContent || {};
  window.LearnContent['primeros-pasos'] = {
    id: 'primeros-pasos',
    title: 'Primeros pasos: levanta el proyecto',
    icon: '🚀',
    estimatedMinutes: 10,
    sections: [
      {
        heading: 'Instalar dependencias',
        bodyHtml: `
          ${djangoVsVue({
            django: '<p><code>pip install -r requirements.txt</code> (idealmente dentro de un virtualenv).</p>',
            vue: '<p>Este repo usa <strong>pnpm</strong> (no <code>npm</code> ni <code>yarn</code> — hay un <code>pnpm-lock.yaml</code>). Si no lo tienes: <code>npm install -g pnpm</code>.</p>',
          })}
          ${codeBlock('bash', `
cd rescue-app
pnpm install
          `)}
          <p>Esto instala todo lo que ya viste: Nuxt, Vue, Tailwind, Pinia Colada, Zod, etc.</p>
        `,
      },
      {
        heading: 'Variables de entorno',
        bodyHtml: `
          <p>Copia el archivo de ejemplo y llena lo mínimo para arrancar:</p>
          ${codeBlock('bash', `
cp .env.example .env
          `)}
          <p>De todas las variables en <code>.env.example</code>, estas dos son las <strong>indispensables</strong> para un arranque básico:</p>
          ${codeBlock('bash', `
NUXT_SESSION_PASSWORD=   # cualquier string largo y aleatorio (firma la cookie de sesión)
NUXT_API_URL=            # la URL base de tu Django real (módulo 10: el proxy la usa para armar el target)
          `)}
          <p>
            El resto (Firebase/VueFire, Google Maps, webhooks de n8n, Sentry) solo hace falta llenarlo
            cuando vayas a tocar esa funcionalidad específica — sin esos valores, esas partes puntuales
            de la UI no van a funcionar, pero el resto del proyecto sí arranca.
          </p>
          ${calloutWarning('Nunca subas tu archivo .env real a git (ya está en .gitignore). Solo .env.example — que es la plantilla — se versiona, y por eso nunca debe llevar valores reales, solo placeholders vacíos.')}
        `,
      },
      {
        heading: 'Levantar el servidor de desarrollo',
        bodyHtml: `
          ${codeBlock('bash', `
pnpm dev
          `)}
          ${djangoVsVue({
            django: '<p><code>python manage.py runserver</code>, normalmente en <code>localhost:8000</code>.</p>',
            vue: '<p><code>pnpm dev</code> levanta Nuxt (cliente + el backend Nitro de <code>server/</code> juntos, un solo proceso) en <code>localhost:3000</code>.</p>',
          })}
          <p>La primera vez tarda un poco más (Nuxt prepara tipos y cachés). Cambios en archivos <code>.vue</code>/<code>.ts</code> se reflejan solos en el navegador sin recargar manualmente (Hot Module Replacement) — edita algo, guarda, y mira la pestaña.</p>
        `,
      },
      {
        heading: 'Los scripts disponibles (package.json)',
        bodyHtml: `
          ${codeBlock('bash', `
pnpm dev          # servidor de desarrollo con HMR
pnpm build        # build de producción
pnpm generate     # build estático (si aplica)
pnpm preview      # sirve el build de producción localmente
pnpm lint         # revisa estilo/errores de ESLint
pnpm lint:fix     # corrige automáticamente lo que se pueda
pnpm typecheck    # corre vue-tsc: valida TODOS los tipos del proyecto
pnpm test         # corre toda la suite de Vitest
pnpm test:unit    # solo pruebas unitarias puras (sin Nuxt)
pnpm test:nuxt    # pruebas que sí necesitan el entorno de Nuxt
pnpm test:e2e     # Playwright (navegador real)
          `)}
          ${calloutTip('<code>pnpm typecheck</code> y <code>pnpm lint</code> son tus dos mejores amigos al revisar cualquier cambio (tuyo o generado por IA) antes de darlo por bueno — lo retomamos en el módulo de Cookbook y en el de IA.')}
        `,
      },
      {
        heading: 'Leer un error cuando algo truena',
        bodyHtml: `
          ${djangoVsVue({
            django: '<p>La página de error amarilla de Django (traceback completo) cuando <code>DEBUG=True</code>.</p>',
            vue: '<p>Un overlay oscuro que cubre la pantalla con el error de Vue/Nuxt: archivo, línea, y el mensaje. Si el error es de compilación de TypeScript, aparece directo en la terminal donde corre <code>pnpm dev</code>, no en el navegador.</p>',
          })}
          <p>Regla práctica: si el overlay señala un archivo <code>.vue</code>, el bug está ahí o en algo que ese componente usa (un composable, un prop mal tipado). Si el error aparece <strong>solo en la terminal</strong> y el navegador sigue mostrando la versión anterior, es casi siempre un error de tipos (<code>vue-tsc</code>) que bloquea la recompilación.</p>
        `,
      },
      {
        heading: 'Haz tu primer cambio de verdad',
        bodyHtml: `
          <p>
            Con el servidor corriendo, abre <code>app/components/rescue/UnlockCountdown.vue</code>
            (el que ya conoces de módulos anteriores) y cambia el texto por defecto de
            <code>expiredHint</code> por otra cosa. Guarda el archivo y mira cómo el navegador se
            actualiza solo, sin que tú hagas nada. Ese ciclo — leer, tocar, ver el resultado — es la
            base de todo lo que sigue en esta guía.
          </p>
        `,
      },
    ],
    quiz: {
      passThreshold: 0.7,
      questions: [
        {
          question: '¿Qué gestor de paquetes usa este proyecto (no npm ni yarn)?',
          options: ['pnpm', 'bun', 'yarn classic', 'npm con --legacy-peer-deps'],
          correctIndex: 0,
          explanation: 'El repo trae un pnpm-lock.yaml — hay que usar pnpm para que las versiones instaladas coincidan con las que usa el equipo.',
        },
        {
          question: '¿Cuáles son las dos variables de entorno mínimas para poder arrancar el proyecto?',
          options: [
            'NUXT_PUBLIC_GOOGLE_MAPS_API_KEY y SENTRY_AUTH_TOKEN',
            'Todas las de .env.example, sin excepción',
            'Ninguna, el proyecto no necesita variables de entorno',
            'NUXT_SESSION_PASSWORD y NUXT_API_URL',
          ],
          correctIndex: 3,
          explanation: 'NUXT_SESSION_PASSWORD firma la cookie de sesión y NUXT_API_URL es la base para el proxy a Django; el resto son integraciones puntuales (Firebase, Maps, n8n, Sentry).',
        },
        {
          question: '¿Qué comando levanta el servidor de desarrollo con recarga en caliente?',
          options: ['pnpm build', 'pnpm generate', 'pnpm dev', 'pnpm preview'],
          correctIndex: 2,
          explanation: 'pnpm dev arranca Nuxt en modo desarrollo (cliente + Nitro) con Hot Module Replacement.',
        },
        {
          question: 'Editas un composable, guardas, y el navegador sigue mostrando la versión vieja mientras la terminal muestra un error. ¿Qué significa eso normalmente?',
          options: [
            'Un error de tipos de TypeScript que está bloqueando la recompilación',
            'Un error de red',
            'Que el archivo se borró',
            'Es normal, no significa nada',
          ],
          correctIndex: 0,
          explanation: 'Cuando el error solo aparece en la terminal (no como overlay en el navegador), casi siempre es vue-tsc rechazando un tipo, lo que impide que la nueva versión compile.',
        },
      ],
    },
  };
})();
