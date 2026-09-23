(function () {
  const { codeBlock, calloutTip, djangoVsVue } = window.Learn;

  window.LearnContent = window.LearnContent || {};
  window.LearnContent['auth-sesiones-permisos'] = {
    id: 'auth-sesiones-permisos',
    title: 'Auth: sesiones y permisos',
    icon: '🔐',
    estimatedMinutes: 13,
    sections: [
      {
        heading: 'Sesión server-side, no JWT en el navegador',
        bodyHtml: `
          ${djangoVsVue({
            django: '<p><code>django.contrib.sessions</code>: el navegador solo guarda un <code>sessionid</code> en una cookie; los datos reales de la sesión viven en el servidor.</p>',
            vue: '<p><code>nuxt-auth-utils</code> hace exactamente lo mismo: guarda una cookie <strong>sellada y firmada</strong> por Nitro, y los datos sensibles (como el token de Django) viven solo del lado del servidor, nunca en JS del navegador.</p>',
            note: 'Esto es deliberadamente distinto a guardar un JWT en localStorage — un JWT en el navegador es legible por cualquier script (incluido uno malicioso vía XSS); una sesión server-side no expone nada directamente.',
          })}
        `,
      },
      {
        heading: 'useUserSession(): el estado de sesión en el cliente',
        bodyHtml: `
          ${codeBlock('vue', `
<script setup lang="ts">
const { loggedIn, user, clear } = useUserSession();
</script>

<template>
  <p v-if="loggedIn">Hola, {{ user.name }}</p>
  <UButton v-else label="Iniciar sesión" @click="navigateTo('/login')" />
</template>
          `)}
          <p><code>loggedIn</code> es un <code>ref</code> reactivo: cambia solo en toda la app cuando la sesión cambia, sin que tengas que sincronizar nada a mano.</p>
        `,
      },
      {
        heading: 'El middleware auth.ts (real, ~5 líneas)',
        bodyHtml: `
          ${djangoVsVue({
            django: '<p><code>LoginRequiredMixin</code> o el decorador <code>@login_required</code> sobre una vista.</p>',
            vue: '<p>Un middleware de ruta que corre antes de navegar. Recuerda: se aplica declarándolo en <code>definePageMeta({ middleware: [...] })</code> (módulo 5), normalmente en el layout padre <code>admin.vue</code> para cubrir todas las rutas hijas de una sola vez.</p>',
          })}
          ${codeBlock('ts', `
// app/middleware/auth.ts (simplificado)
export default defineNuxtRouteMiddleware(() => {
  const { loggedIn } = useUserSession();
  if (!loggedIn.value) {
    return navigateTo('/login');
  }
});
          `)}
        `,
      },
      {
        heading: 'nuxt-authorization: permisos (abilities)',
        bodyHtml: `
          ${djangoVsVue({
            django: '<p>Permisos de DRF (<code>IsAdminUser</code>, permisos custom) o <code>django-guardian</code> para permisos por objeto.</p>',
            vue: '<p>Una <strong>ability</strong>: una función que responde "¿puede este usuario hacer X?". Se usa tanto en el middleware <code>authorization.ts</code> como del lado del proxy (módulo 10, <code>abilityForApiPath</code>).</p>',
          })}
          ${codeBlock('ts', `
// definición de una ability
export const editarCatalogo = defineAbility((user) => user.role === 'admin');

// uso en un middleware o en el proxy
await authorize(event, editarCatalogo);
// si el usuario no cumple la regla, lanza 403 automáticamente
          `)}
        `,
      },
      {
        heading: 'El grupo (auth) y su middleware inverso: guest.ts',
        bodyHtml: `
          <p>
            Recordando el módulo 5: <code>app/pages/(auth)/login.vue</code> y
            <code>password-reset.vue</code> viven en un grupo de rutas. Tienen su propio middleware
            <code>guest.ts</code> — el inverso de <code>auth.ts</code>: si <strong>ya</strong> tienes
            sesión activa y entras a <code>/login</code>, te redirige lejos de ahí (no tiene sentido
            mostrar el login a alguien que ya inició sesión).
          </p>
        `,
      },
      {
        heading: 'El flujo completo',
        bodyHtml: `
          ${codeBlock('bash', `
1. Usuario llena el formulario de /login
2. server/api/auth/login.post.ts recibe el POST, llama a Django para autenticar
3. Django responde con un token válido
4. Nitro guarda ese token en la sesión server-side (cookie sellada, no visible al JS del navegador)
5. En cada petición siguiente, el proxy (módulo 10) reutiliza ese token
   para hablar con Django, sin que el navegador vuelva a mandar credenciales
          `)}
        `,
      },
    ],
    playground: {
      starterCode: `
const { createApp, ref } = Vue;

// Simulación del flujo de sesión: loggedIn es reactivo, como useUserSession()
function useFakeSession() {
  const loggedIn = ref(false);
  const user = ref(null);

  function login(nombre) {
    // aquí en la vida real: POST a /api/auth/login -> Nitro guarda el token
    loggedIn.value = true;
    user.value = { name: nombre };
  }

  function logout() {
    loggedIn.value = false;
    user.value = null;
  }

  return { loggedIn, user, login, logout };
}

const App = {
  setup() {
    const { loggedIn, user, login, logout } = useFakeSession();
    return { loggedIn, user, login, logout };
  },
  template: \`
    <div style="font-family: sans-serif;">
      <p v-if="loggedIn">Sesión activa: <strong>{{ user.name }}</strong></p>
      <p v-else>Sin sesión</p>

      <button v-if="!loggedIn" @click="login('Ana')" style="padding:6px 12px; cursor:pointer;">
        Iniciar sesión
      </button>
      <button v-else @click="logout" style="padding:6px 12px; cursor:pointer;">
        Cerrar sesión
      </button>

      <button :disabled="!loggedIn" style="padding:6px 12px; margin-left:8px; cursor:pointer;">
        Acción protegida (solo con sesión)
      </button>
    </div>
  \`,
};

const app = createApp(App);
app.mount(mountEl);
`,
      solutionCode: `
const { createApp, ref } = Vue;

function useFakeSession() {
  const loggedIn = ref(false);
  const user = ref(null);

  function login(nombre) {
    loggedIn.value = true;
    user.value = { name: nombre };
  }

  function logout() {
    loggedIn.value = false;
    user.value = null;
  }

  return { loggedIn, user, login, logout };
}

const App = {
  setup() {
    const { loggedIn, user, login, logout } = useFakeSession();
    return { loggedIn, user, login, logout };
  },
  template: \`
    <div style="font-family: sans-serif;">
      <p v-if="loggedIn">Sesión activa: <strong>{{ user.name }}</strong></p>
      <p v-else>Sin sesión</p>

      <button v-if="!loggedIn" @click="login('Ana')" style="padding:6px 12px; cursor:pointer;">Iniciar sesión</button>
      <button v-else @click="logout" style="padding:6px 12px; cursor:pointer;">Cerrar sesión</button>

      <button :disabled="!loggedIn" style="padding:6px 12px; margin-left:8px; cursor:pointer;">
        Acción protegida (solo con sesión)
      </button>
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
          question: '¿Por qué este proyecto usa sesión server-side en vez de un JWT guardado en localStorage?',
          options: [
            'Por moda, no hay razón técnica',
            'localStorage no existe en Nuxt',
            'JWT es más lento de procesar',
            'Un JWT en localStorage es legible por cualquier script, incluido uno malicioso vía XSS; la sesión server-side no expone el token al navegador',
          ],
          correctIndex: 3,
          explanation: 'Igual que en Django con sus sesiones, mantener el dato sensible (el token) solo del lado del servidor reduce la superficie de ataque frente a XSS.',
        },
        {
          question: '¿Qué diferencia hay entre app/middleware/auth.ts y app/middleware/guest.ts?',
          options: [
            'Son el mismo archivo con nombres distintos',
            'guest.ts es para usuarios administradores',
            'auth.ts exige sesión activa; guest.ts hace lo contrario, redirige lejos si YA hay sesión activa (ej. en /login)',
            'auth.ts solo aplica a la API, no a las páginas',
          ],
          correctIndex: 2,
          explanation: 'auth.ts protege rutas que requieren estar logueado; guest.ts protege rutas como login que no tiene sentido mostrar a alguien que ya inició sesión.',
        },
        {
          question: '¿Qué es una "ability" en el contexto de nuxt-authorization?',
          options: [
            'Un componente visual',
            'Una función que responde si un usuario puede o no realizar cierta acción',
            'Un tipo de composable de datos',
            'Un middleware de rutas de solo lectura',
          ],
          correctIndex: 1,
          explanation: 'Una ability encapsula una regla de permisos (similar a un permiso de DRF o de django-guardian) y se evalúa con authorize(event, ability).',
        },
      ],
    },
  };
})();
