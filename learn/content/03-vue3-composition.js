(function () {
  const { codeBlock, calloutTip, calloutWarning, djangoVsVue } = window.Learn;

  window.LearnContent = window.LearnContent || {};
  window.LearnContent['vue3-composition'] = {
    id: 'vue3-composition',
    title: 'Vue 3: Composition API',
    icon: '🖖',
    estimatedMinutes: 16,
    sections: [
      {
        heading: 'Antes de empezar: por qué el playground no usa <script setup>',
        bodyHtml: `
          ${calloutTip(
            'En el repo real, Vite compila cada archivo <code>.vue</code> (con <code>&lt;script setup lang="ts"&gt;</code>) antes de enviarlo al navegador. ' +
            'El playground de esta guía no tiene ese paso de build — usa Vue cargado directo por CDN, cuyo build no incluye ese compilador. ' +
            'Por eso aquí escribes <code>Vue.createApp({ setup() {...}, template: "..." })</code> a mano: hace <em>exactamente lo mismo</em> que un SFC, solo que sin el azúcar sintáctico que añade Vite.',
          )}
        `,
      },
      {
        heading: 'ref vs reactive',
        bodyHtml: `
          <p><code>ref</code> envuelve un valor cualquiera (número, string, objeto) — accedes/modificas con <code>.value</code> en JS/TS (en el template, Vue lo "desenvuelve" solo). <code>reactive</code> envuelve directamente un objeto, sin <code>.value</code>.</p>
          ${codeBlock('ts', `
import { ref, reactive } from 'vue';

const contador = ref(0);
contador.value++; // hay que usar .value fuera del template

const filtros = reactive({ folio: '', estado: 'todos' });
filtros.folio = 'REM-2026'; // sin .value
          `)}
          ${calloutTip('Este repo usa casi siempre <code>ref</code> (incluso para objetos), porque es más fácil de pasar entre funciones/composables sin perder la reactividad. <code>reactive</code> aparece poco.')}
        `,
      },
      {
        heading: 'computed: valores derivados',
        bodyHtml: `
          <p>Ejemplo real de <code>UnlockCountdown.vue</code>:</p>
          ${codeBlock('ts', `
const visible = computed(
  () => isActive.value || (isExpired.value && props.showExpiredHint),
);

const label = computed(() => {
  if (isExpired.value && props.showExpiredHint) {
    return props.expiredHint;
  }
  return \`Edición: \${remainingLabel.value}\`;
});
          `)}
          <p><code>computed</code> se recalcula solo cuando alguna de sus dependencias reactivas cambia, y cachea el resultado mientras tanto — como una <code>@property</code> de Python, pero reactiva.</p>
        `,
      },
      {
        heading: 'watch y watchEffect',
        bodyHtml: `
          <p>Cuando necesitas <em>reaccionar</em> a un cambio (no solo derivar un valor), usas <code>watch</code> (explícito, sobre una fuente concreta) o <code>watchEffect</code> (automático, sobre todo lo que uses dentro).</p>
          ${codeBlock('ts', `
import { watch, watchEffect } from 'vue';

watch(folioSearch, (nuevo, anterior) => {
  console.log('cambió de', anterior, 'a', nuevo);
});

watchEffect(() => {
  // corre de inmediato, y de nuevo cada vez que cambie folioSearch.value
  document.title = \`Buscando: \${folioSearch.value}\`;
});
          `)}
        `,
      },
      {
        heading: 'defineProps, defineEmits y withDefaults',
        bodyHtml: `
          <p>Ya viste <code>defineProps</code> en el módulo de TypeScript. <code>defineEmits</code> declara qué eventos puede emitir el componente hacia su padre (el equivalente a devolver datos hacia arriba, sin necesitar un callback manual):</p>
          ${codeBlock('ts', `
const emit = defineEmits<{
  select: [id: number];
  close: [];
}>();

function onRowClick(id: number) {
  emit('select', id);
}
          `)}
        `,
      },
      {
        heading: 'defineModel: v-model directo',
        bodyHtml: `
          <p>Patrón real de <code>RescuesExcelReportModal.vue</code>, para que un componente hijo controle un <code>v-model</code> del padre sin declarar <code>modelValue</code> + <code>emit('update:modelValue')</code> a mano:</p>
          ${codeBlock('ts', `
// dentro del componente hijo:
const open = defineModel<boolean>('open');

function cerrar() {
  open.value = false;
}
          `)}
          ${codeBlock('html', `
<!-- en el padre: -->
<RescuesExcelReportModal v-model:open="showReportModal" />
          `)}
        `,
      },
    ],
    playground: {
      starterCode: `
const { createApp, ref, computed } = Vue;

const App = {
  setup() {
    const contador = ref(0);
    const doble = computed(() => contador.value * 2);
    const esPar = computed(() => contador.value % 2 === 0);

    function incrementar() {
      contador.value++;
    }

    return { contador, doble, esPar, incrementar };
  },
  template: \`
    <div style="font-family: sans-serif;">
      <p>Contador: <strong>{{ contador }}</strong></p>
      <p>Doble (computed): <strong>{{ doble }}</strong></p>
      <p>¿Es par?: <strong>{{ esPar ? 'Sí' : 'No' }}</strong></p>
      <button @click="incrementar" style="padding: 6px 12px; cursor: pointer;">
        +1
      </button>
    </div>
  \`,
};

const app = createApp(App);
app.mount(mountEl);

// Reto: agrega un botón "Reiniciar" que ponga contador de vuelta en 0
`,
      solutionCode: `
const { createApp, ref, computed } = Vue;

const App = {
  setup() {
    const contador = ref(0);
    const doble = computed(() => contador.value * 2);
    const esPar = computed(() => contador.value % 2 === 0);

    function incrementar() {
      contador.value++;
    }
    function reiniciar() {
      contador.value = 0;
    }

    return { contador, doble, esPar, incrementar, reiniciar };
  },
  template: \`
    <div style="font-family: sans-serif;">
      <p>Contador: <strong>{{ contador }}</strong></p>
      <p>Doble (computed): <strong>{{ doble }}</strong></p>
      <p>¿Es par?: <strong>{{ esPar ? 'Sí' : 'No' }}</strong></p>
      <button @click="incrementar" style="padding: 6px 12px; cursor: pointer;">+1</button>
      <button @click="reiniciar" style="padding: 6px 12px; cursor: pointer; margin-left: 6px;">
        Reiniciar
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
          question: 'Dentro de <script setup lang="ts"> (fuera del template), ¿cómo lees el valor de const contador = ref(0)?',
          options: ['contador', 'contador.get()', 'contador()', 'contador.value'],
          correctIndex: 3,
          explanation: 'En JS/TS necesitas .value para leer o escribir un ref. En el template, Vue lo desenvuelve automáticamente.',
        },
        {
          question: '¿Cuándo se vuelve a calcular un computed()?',
          options: [
            'Cada vez que el componente se re-renderiza, sin importar nada más',
            'Nunca, solo se calcula una vez',
            'Solo cuando alguna de sus dependencias reactivas cambia',
            'Cada segundo automáticamente',
          ],
          correctIndex: 2,
          explanation: 'computed cachea su resultado y solo lo recalcula cuando cambia algo reactivo que usa en su función.',
        },
        {
          question: '¿Qué diferencia principal hay entre watch(fuente, cb) y watchEffect(fn)?',
          options: [
            'No hay ninguna diferencia',
            'watchEffect solo funciona con arrays',
            'watch necesita una fuente explícita; watchEffect detecta automáticamente qué reactivos usa',
            'watch es más lento que watchEffect',
          ],
          correctIndex: 2,
          explanation: 'watch observa una fuente específica que tú declaras; watchEffect corre de inmediato y vuelve a correr cada vez que cambia cualquier dato reactivo que haya leído dentro.',
        },
        {
          question: '¿Qué hace defineModel<boolean>(\'open\') en un componente hijo?',
          options: [
            'Define una prop normal llamada open, sin más',
            'Solo funciona con números',
            'Crea un nuevo componente llamado open',
            'Crea un v-model bidireccional con el padre, sin declarar modelValue/emit manualmente',
          ],
          correctIndex: 3,
          explanation: 'defineModel es azúcar sintáctico para v-model: el hijo puede leer y escribir open.value, y eso se sincroniza automáticamente con v-model:open en el padre.',
        },
        {
          question: '¿Por qué el playground de esta guía no puede usar <script setup> directamente?',
          options: [
            'Porque Vue 3 ya no soporta <script setup>',
            'Es una limitación del navegador, no de Vue',
            'Porque el build de Vue por CDN no incluye el compilador de Single File Components',
            'Porque <script setup> solo funciona con Nuxt',
          ],
          correctIndex: 2,
          explanation: 'Compilar un .vue con <script setup> requiere @vue/compiler-sfc, que normalmente corre en el paso de build (Vite). El build global de Vue por CDN no lo incluye.',
        },
      ],
    },
  };
})();
