(function () {
  const { codeBlock, calloutTip, calloutWarning, djangoVsVue } = window.Learn;

  window.LearnContent = window.LearnContent || {};
  window.LearnContent['bff-proxy-django'] = {
    id: 'bff-proxy-django',
    title: 'El patrón BFF: proxy a Django',
    icon: '🔌',
    estimatedMinutes: 18,
    sections: [
      {
        heading: '¿Qué es un BFF?',
        bodyHtml: `
          <p>
            BFF = <strong>Backend-For-Frontend</strong>: un backend chico, dedicado exclusivamente
            a servir a este frontend, que se sienta <em>entre</em> el navegador y tu API real. En
            este repo, ese BFF es <strong>Nitro</strong> — el servidor que trae Nuxt integrado,
            viviendo en la carpeta <code>server/</code>.
          </p>
          ${calloutTip('Piensa en Nitro como "otra app, escrita en TypeScript/Node, que vive delante de tu Django real". No reemplaza a Django — lo protege y lo complementa.')}
          ${codeBlock('bash', `
Navegador  --fetch("/api/rescue/list/")-->  Nitro (server/api/)  --Authorization: Token xxx-->  Django REST API
              (nunca conoce la URL           (valida sesión,          (tu API de siempre,
               real de Django)                agrega el token,         sin cambios)
                                               registra métricas)
          `)}
        `,
      },
      {
        heading: 'Anatomía de server/api/',
        bodyHtml: `
          ${djangoVsVue({
            django: '<p><code>urls.py</code> mapea rutas a funciones de <code>views.py</code>.</p>',
            vue: '<p>Cada archivo dentro de <code>server/api/</code> ES una ruta, igual que <code>app/pages/</code> pero para el backend. <code>server/api/auth/logout.post.ts</code> responde a <code>POST /api/auth/logout</code>.</p>',
          })}
          <p>Pero rescue-app no define un archivo por cada endpoint de Django — usa <strong>un único archivo catch-all</strong> que reenvía cualquier ruta:</p>
        `,
      },
      {
        heading: 'Lectura comentada: server/api/[...].ts',
        bodyHtml: `
          <p><code>[...].ts</code> es una ruta catch-all: <code>[...]</code> captura cualquier path que no coincida con un archivo más específico. Este es (simplificado) el corazón del proxy:</p>
          ${codeBlock('ts', `
// server/api/[...].ts
export default defineEventHandler(async (event) => {
  // 1) valida que haya una sesión activa y saca el token guardado
  const { token, requestId } = await requireProxySession(event);

  // 2) URL base de Django, viene de una variable de entorno (NUXT_API_URL)
  const apiUrl = useRuntimeConfig().apiUrl;

  // 3) verifica permisos: ¿puede este usuario llamar a esta ruta?
  await authorize(event, abilityForApiPath(event.path));

  // 4) el path de Nuxt ES el path de Django, literal
  const target = joinURL(apiUrl, event.path);

  // 5) reenvía la petición completa (método, body, query) a Django
  return proxyDjangoRequest(event, target, token, requestId);
});
          `)}
          <p>Cuando el navegador pide <code>/api/rescue/list/</code>, este archivo intercepta esa petición <strong>antes</strong> de que llegue a Django, hace sus validaciones, y recién entonces la reenvía.</p>
        `,
      },
      {
        heading: 'El header Authorization: Token — tu DRF de siempre',
        bodyHtml: `
          ${codeBlock('ts', `
// server/utils/django-proxy.ts
export function djangoProxyHeaders(token: string, requestId: string) {
  return {
    Authorization: \`Token \${token}\`,   // exactamente lo que espera TokenAuthentication de DRF
    'Accept-Language': 'es',
    [REQUEST_ID_HEADER]: requestId,
  };
}
          `)}
          ${djangoVsVue({
            django: '<p>Tu <code>TokenAuthentication</code> de Django REST Framework espera el header <code>Authorization: Token &lt;token&gt;</code> en cada petición.</p>',
            vue: '<p>El navegador <strong>nunca ve ese token</strong>. Vive solo en la sesión server-side de Nitro (módulo 11), y Nitro lo agrega él mismo antes de reenviar a Django.</p>',
            note: 'Del lado de Django, esta petición se ve exactamente igual que si viniera de cualquier otro cliente de tu API — no tienes que cambiar nada en Django para que esto funcione.',
          })}
        `,
      },
      {
        heading: 'El path es 1:1 entre Nuxt y Django',
        bodyHtml: `
          <p>
            <code>joinURL(apiUrl, event.path)</code> concatena la URL base de Django con el path
            exacto que pidió el navegador. Por eso las constantes de rutas en este repo usan el
            path <strong>tal cual lo espera Django</strong>, slash final incluido:
          </p>
          ${codeBlock('ts', `
// app/constants/rescue-api.ts
export const RESCUE_LIST_PATH = '/api/rescue/list/';

// cuando el navegador llama a fetch('/api/rescue/list/'), Nitro intercepta,
// valida, y reenvía a: \${NUXT_API_URL}/api/rescue/list/
          `)}
          ${calloutWarning('Si ves una constante de ruta en app/constants/ o app/composables/ que no cuadra con un endpoint real de tu Django, probablemente el bug está ahí — no en Vue.')}
        `,
      },
      {
        heading: 'Errores y observabilidad: separar "culpa" de Nitro vs Django',
        bodyHtml: `
          <p>
            El proxy también reporta a Sentry si Django devuelve <code>401</code>/<code>403</code> (falla
            de autenticación/permisos) o <code>500</code> (error del propio Django), y agrega headers
            <code>Server-Timing</code> que separan cuánto tiempo tomó Nitro vs cuánto tomó Django —
            muy útil para saber, ante una petición lenta, si el cuello de botella está en el proxy o
            en tu API.
          </p>
          ${codeBlock('bash', `
Server-Timing: app;dur=12, django;dur=340
                └─ Nitro: 12ms         └─ Django: 340ms (aquí está el problema)
          `)}
        `,
      },
    ],
    playground: {
      starterCode: `
const { createApp, ref, computed } = Vue;

// Simulador del proxy: arma la URL destino igual que joinURL(apiUrl, path)
// y muestra los headers que Nitro agregaría antes de "enviar" a Django.
function joinURL(base, path) {
  return base.replace(/\\/$/, '') + path;
}

function mockDjango(path) {
  // simula lo que respondería tu Django real
  return { status: 200, body: { path, ok: true } };
}

const App = {
  setup() {
    const apiUrl = ref('https://api.rescue.internal');
    const path = ref('/api/rescue/list/');
    const token = ref('abc123tokendemo');

    const target = computed(() => joinURL(apiUrl.value, path.value));
    const headers = computed(() => ({
      Authorization: \`Token \${token.value}\`,
      'Accept-Language': 'es',
    }));

    const respuesta = ref(null);
    function enviar() {
      respuesta.value = mockDjango(path.value);
    }

    return { apiUrl, path, token, target, headers, respuesta, enviar };
  },
  template: \`
    <div style="font-family: sans-serif; font-size: 14px;">
      <label>Path solicitado por el navegador:</label>
      <input v-model="path" style="width:100%; padding:6px; font-family:monospace; margin-bottom:10px;" />

      <p><strong>URL destino (target):</strong> <code>{{ target }}</code></p>
      <p><strong>Headers que agrega Nitro:</strong></p>
      <pre style="background:#eee; padding:8px; border-radius:6px;">{{ JSON.stringify(headers, null, 2) }}</pre>

      <button @click="enviar" style="padding:6px 12px; cursor:pointer;">Enviar a Django (simulado)</button>
      <pre v-if="respuesta" style="background:#eee; padding:8px; border-radius:6px; margin-top:10px;">{{ JSON.stringify(respuesta, null, 2) }}</pre>
    </div>
  \`,
};

const app = createApp(App);
app.mount(mountEl);

// Reto: agrega una verificación antes de "enviar()" — si "token" está vacío,
// no llames a mockDjango() y en su lugar pon respuesta.value = { status: 401 }
`,
      solutionCode: `
const { createApp, ref, computed } = Vue;

function joinURL(base, path) {
  return base.replace(/\\/$/, '') + path;
}

function mockDjango(path) {
  return { status: 200, body: { path, ok: true } };
}

const App = {
  setup() {
    const apiUrl = ref('https://api.rescue.internal');
    const path = ref('/api/rescue/list/');
    const token = ref('abc123tokendemo');

    const target = computed(() => joinURL(apiUrl.value, path.value));
    const headers = computed(() => ({
      Authorization: \`Token \${token.value}\`,
      'Accept-Language': 'es',
    }));

    const respuesta = ref(null);
    function enviar() {
      // Reto resuelto: sin token, ni siquiera llamamos a Django (401 local)
      if (!token.value) {
        respuesta.value = { status: 401, body: { error: 'Sin sesión' } };
        return;
      }
      respuesta.value = mockDjango(path.value);
    }

    return { apiUrl, path, token, target, headers, respuesta, enviar };
  },
  template: \`
    <div style="font-family: sans-serif; font-size: 14px;">
      <label>Path solicitado por el navegador:</label>
      <input v-model="path" style="width:100%; padding:6px; font-family:monospace; margin-bottom:10px;" />
      <label>Token (vacíalo para probar el 401):</label>
      <input v-model="token" style="width:100%; padding:6px; font-family:monospace; margin-bottom:10px;" />

      <p><strong>URL destino (target):</strong> <code>{{ target }}</code></p>
      <p><strong>Headers que agrega Nitro:</strong></p>
      <pre style="background:#eee; padding:8px; border-radius:6px;">{{ JSON.stringify(headers, null, 2) }}</pre>

      <button @click="enviar" style="padding:6px 12px; cursor:pointer;">Enviar a Django (simulado)</button>
      <pre v-if="respuesta" style="background:#eee; padding:8px; border-radius:6px; margin-top:10px;">{{ JSON.stringify(respuesta, null, 2) }}</pre>
    </div>
  \`,
};

const app = createApp(App);
app.mount(mountEl);
`,
    },
    quiz: {
      passThreshold: 0.7,
      questions: [
        {
          question: '¿Qué es un BFF (Backend-For-Frontend) en el contexto de este proyecto?',
          options: [
            'Un backend chico (Nitro) que se sienta entre el navegador y Django, dedicado a este frontend',
            'Un reemplazo completo de Django',
            'Una librería de componentes visuales',
            'El nombre del framework Vue',
          ],
          correctIndex: 0,
          explanation: 'El BFF centraliza autenticación, permisos y observabilidad para este frontend específico, sin que el navegador hable directo con Django.',
        },
        {
          question: '¿Por qué el archivo se llama server/api/[...].ts?',
          options: [
            'Es un typo, debería ser un nombre normal',
            'Solo funciona para rutas de exactamente 3 puntos',
            'Los corchetes con [...] forman una ruta catch-all que captura cualquier path no manejado por un archivo más específico',
            'Es una convención exclusiva de TypeScript sin relación con el routing',
          ],
          correctIndex: 2,
          explanation: 'Es el mismo mecanismo de rutas dinámicas del módulo 5, aplicado a server/api/: [...] es un catch-all que reenvía cualquier ruta no capturada antes.',
        },
        {
          question: '¿Qué header agrega Nitro antes de reenviar la petición a Django, y para qué sirve en DRF?',
          options: [
            'Content-Type: text/plain, para forzar texto plano',
            'X-Frame-Options, para seguridad de iframes',
            'No agrega ningún header adicional',
            'Authorization: Token <token>, que corresponde a TokenAuthentication de Django REST Framework',
          ],
          correctIndex: 3,
          explanation: 'djangoProxyHeaders arma el header Authorization con el token guardado server-side, exactamente en el formato que espera TokenAuthentication de DRF.',
        },
        {
          question: '¿Por qué el path de una constante como RESCUE_LIST_PATH tiene slash final, ej. "/api/rescue/list/"?',
          options: [
            'Porque ese path se concatena literal con la URL base de Django (joinURL), y Django lo espera así',
            'Es un error de estilo sin importancia',
            'Porque Nuxt lo requiere para todas las rutas',
            'Para diferenciarlo de las rutas de páginas',
          ],
          correctIndex: 0,
          explanation: 'El path de la constante es exactamente el path que recibirá Django del otro lado del proxy — debe coincidir con las urls.py de Django, incluyendo el slash final.',
        },
        {
          question: '¿Qué te dice un header como Server-Timing: app;dur=12, django;dur=340?',
          options: [
            'Que hubo un error 500',
            'El número de reintentos que hizo el proxy',
            'Que Nitro tardó 12ms y Django tardó 340ms — el cuello de botella está en Django, no en el proxy',
            'Que la petición fue cacheada',
          ],
          correctIndex: 2,
          explanation: 'Server-Timing separa la latencia propia del BFF de la latencia de la petición upstream a Django, ayudando a diagnosticar dónde está la lentitud real.',
        },
        {
          question: '¿Qué pasa del lado de Django cuando llega una petición reenviada por el proxy de Nitro?',
          options: [
            'Django tiene que tener código especial para detectar que viene de un proxy',
            'Django rechaza automáticamente las peticiones que no vienen del navegador directo',
            'Django deja de requerir autenticación en ese caso',
            'Django la ve como cualquier otra petición autenticada con Token, sin necesitar cambios',
          ],
          correctIndex: 3,
          explanation: 'El proxy es transparente para Django: reenvía método, body, query y el header Authorization correcto, así que tu API se comporta exactamente igual que si el cliente llamara directo.',
        },
      ],
    },
  };
})();
