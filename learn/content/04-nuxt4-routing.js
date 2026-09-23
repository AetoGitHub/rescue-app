(function () {
  const { codeBlock, calloutTip, djangoVsVue } = window.Learn;

  window.LearnContent = window.LearnContent || {};
  window.LearnContent['nuxt4-routing'] = {
    id: 'nuxt4-routing',
    title: 'Nuxt 4: routing por archivos',
    icon: '🗂️',
    estimatedMinutes: 12,
    sections: [
      {
        heading: 'De urls.py a carpetas de verdad',
        bodyHtml: `
          ${djangoVsVue({
            django: '<p>Declaras cada ruta a mano en <code>urls.py</code>: <code>path("rescue/&lt;int:id&gt;/evidencias/", views.evidencias)</code>.</p>',
            vue: '<p>La ruta la determina <strong>dónde pones el archivo</strong> dentro de <code>app/pages/</code>. No hay un urls.py — Nuxt escanea la carpeta y arma las rutas solo.</p>',
          })}
          ${codeBlock('bash', `
app/pages/admin/dashboard.vue            ->  /admin/dashboard
app/pages/rescue/[id]/evidencias.vue     ->  /rescue/42/evidencias
app/pages/(auth)/login.vue               ->  /login
          `)}
        `,
      },
      {
        heading: 'Rutas dinámicas: [id]',
        bodyHtml: `
          <p>Un segmento de carpeta o archivo entre corchetes se vuelve un parámetro de ruta — el equivalente a <code>&lt;int:id&gt;</code> en Django.</p>
          ${codeBlock('ts', `
// app/pages/rescue/[id]/evidencias.vue
const route = useRoute();
const rescueId = computed(() => Number(route.params.id));
          `)}
        `,
      },
      {
        heading: 'Grupos de rutas: (auth)',
        bodyHtml: `
          <p>Una carpeta entre paréntesis <strong>organiza archivos sin agregar segmento a la URL</strong>. <code>app/pages/(auth)/login.vue</code> sigue siendo <code>/login</code>, no <code>/auth/login</code>. Solo es una forma de agrupar páginas relacionadas (login, password-reset) sin ensuciar la URL.</p>
        `,
      },
      {
        heading: 'Layouts anidados: admin.vue',
        bodyHtml: `
          <p>Un archivo <code>admin.vue</code> junto a la carpeta <code>admin/</code> actúa de "layout padre" para todo lo que esté dentro:</p>
          ${codeBlock('vue', `
<!-- app/pages/admin.vue -->
<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'authorization'],
});
</script>

<template>
  <NuxtPage />
</template>
          `)}
          <p>
            <code>&lt;NuxtPage /&gt;</code> es donde se renderiza la ruta hija real (<code>admin/dashboard.vue</code>,
            <code>admin/operational/index.vue</code>, etc.) — parecido a un <code>{% block content %}</code> de un
            template base de Django, pero automático para todas las rutas bajo <code>admin/</code>.
          </p>
        `,
      },
      {
        heading: 'definePageMeta y middleware',
        bodyHtml: `
          ${djangoVsVue({
            django: '<p><code>@login_required</code> o <code>LoginRequiredMixin</code> sobre una vista específica.</p>',
            vue: '<p><code>definePageMeta({ middleware: [\'auth\', \'authorization\'] })</code> dentro de la página (o de un layout padre, aplicándose a todas sus rutas hijas).</p>',
          })}
          <p>El middleware corre <strong>antes</strong> de navegar a la página — si no hay sesión válida, redirige a <code>/login</code> sin llegar a renderizar nada protegido.</p>
        `,
      },
      {
        heading: 'Navegar entre páginas',
        bodyHtml: `
          ${codeBlock('vue', `
<NuxtLink to="/admin/dashboard">Ir al dashboard</NuxtLink>
          `)}
          ${codeBlock('ts', `
// navegación programática, ej. después de guardar un formulario
await navigateTo(\`/rescue/\${id}/evidencias\`);
          `)}
        `,
      },
    ],
    playground: {
      starterCode: `
const { createApp, ref, computed } = Vue;

// Simulador de file-based routing: dado un "archivo" (string),
// calcula qué URL genera Nuxt — sin Nuxt real, solo la regla en JS puro.
function archivoAUrl(ruta) {
  return ruta
    .replace(/^app\\/pages\\//, '')
    .replace(/\\.vue$/, '')
    .replace(/\\/index$/, '')
    .replace(/\\(auth\\)\\//, '')       // los grupos (auth) no aportan segmento
    .replace(/\\[(\\w+)\\]/g, ':$1')   // [id] -> :id (para mostrarlo claro)
    .replace(/^$/, '/');
}

const App = {
  setup() {
    const archivo = ref('app/pages/rescue/[id]/evidencias.vue');
    const url = computed(() => '/' + archivoAUrl(archivo.value));

    return { archivo, url };
  },
  template: \`
    <div style="font-family: sans-serif;">
      <label style="display:block; margin-bottom:6px;">Archivo en app/pages/:</label>
      <input v-model="archivo" style="width: 100%; padding: 6px; font-family: monospace;" />
      <p style="margin-top: 12px;">URL resultante: <strong>{{ url }}</strong></p>
    </div>
  \`,
};

const app = createApp(App);
app.mount(mountEl);

// Reto: cambia el valor inicial de "archivo" a
// "app/pages/(auth)/password-reset.vue" y observa la URL resultante
`,
      solutionCode: `
const { createApp, ref, computed } = Vue;

function archivoAUrl(ruta) {
  return ruta
    .replace(/^app\\/pages\\//, '')
    .replace(/\\.vue$/, '')
    .replace(/\\/index$/, '')
    .replace(/\\(auth\\)\\//, '')
    .replace(/\\[(\\w+)\\]/g, ':$1')
    .replace(/^$/, '/');
}

const App = {
  setup() {
    const archivo = ref('app/pages/(auth)/password-reset.vue');
    const url = computed(() => '/' + archivoAUrl(archivo.value));
    return { archivo, url };
  },
  template: \`
    <div style="font-family: sans-serif;">
      <label style="display:block; margin-bottom:6px;">Archivo en app/pages/:</label>
      <input v-model="archivo" style="width: 100%; padding: 6px; font-family: monospace;" />
      <p style="margin-top: 12px;">URL resultante: <strong>{{ url }}</strong></p>
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
          question: '¿Qué URL genera el archivo app/pages/admin/dashboard.vue?',
          options: ['/admin/dashboard', '/dashboard', '/pages/admin/dashboard', '/admin/dashboard.vue'],
          correctIndex: 0,
          explanation: 'Nuxt convierte la ruta de carpetas dentro de app/pages/ directamente en la URL, quitando la extensión .vue.',
        },
        {
          question: '¿Qué hace una carpeta entre paréntesis como (auth)?',
          options: [
            'Agrega "auth" como segmento de la URL',
            'No tiene ningún efecto, es solo un comentario',
            'Hace la ruta privada automáticamente',
            'Agrupa archivos sin agregar segmento a la URL',
          ],
          correctIndex: 3,
          explanation: 'Los paréntesis crean un "grupo de rutas": organizan archivos relacionados sin afectar la URL final.',
        },
        {
          question: '¿Qué renderiza <NuxtPage /> dentro de app/pages/admin.vue?',
          options: [
            'La ruta hija real que corresponda, ej. admin/dashboard.vue',
            'Siempre la misma página de bienvenida',
            'Nada, es solo decorativo',
            'Una lista de todas las rutas disponibles',
          ],
          correctIndex: 0,
          explanation: 'admin.vue actúa de layout padre para todo lo bajo admin/, y <NuxtPage /> es donde se inserta la página hija correspondiente a la URL actual.',
        },
        {
          question: '¿Cuál es el equivalente más cercano en Django a definePageMeta({ middleware: [\'auth\'] })?',
          options: [
            'Un modelo de Django',
            'settings.py',
            'LoginRequiredMixin o @login_required',
            'Un serializer de DRF',
          ],
          correctIndex: 2,
          explanation: 'Ambos corren antes de que se procese/renderice la vista, y redirigen si no se cumple la condición de acceso.',
        },
      ],
    },
  };
})();
