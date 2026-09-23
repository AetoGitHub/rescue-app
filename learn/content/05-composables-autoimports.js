(function () {
  const { codeBlock, calloutTip, djangoVsVue } = window.Learn;

  window.LearnContent = window.LearnContent || {};
  window.LearnContent['composables-autoimports'] = {
    id: 'composables-autoimports',
    title: 'Composables y auto-imports',
    icon: '🧩',
    estimatedMinutes: 13,
    sections: [
      {
        heading: '¿Qué es un composable?',
        bodyHtml: `
          <p>
            Un composable es simplemente <strong>una función que empieza con <code>use</code> y usa
            reactividad de Vue por dentro</strong> (<code>ref</code>, <code>computed</code>, etc.).
            Es la forma estándar de sacar lógica reutilizable fuera de un componente — como sacar un
            helper o un mixin en Django, pero pensado para datos reactivos.
          </p>
          ${codeBlock('ts', `
// versión simplificada de app/composables/useRescueChatMessages.ts
export function useRescueChatMessages(rescueId) {
  const apiFetch = useApiFetch();
  const id = computed(() => toValue(rescueId));

  const { data, asyncStatus, error, refresh } = useInfiniteQuery({
    key: () => ['rescue-chat-messages', id.value ?? ''],
    enabled: () => id.value != null,
    query: () => apiFetch(\`/api/rescue/\${id.value}/chat/messages/\`),
  });

  const messages = computed(() => data.value?.pages.flat() ?? []);

  return { messages, asyncStatus, error, refresh };
}
          `)}
          <p>Este repo tiene <strong>~110 composables</strong> en <code>app/composables/</code>, cada uno resolviendo un pedazo de lógica de negocio reutilizable (traer datos, validar, calcular, sincronizar con la URL, etc.).</p>
        `,
      },
      {
        heading: 'Auto-imports: sin escribir import',
        bodyHtml: `
          ${djangoVsVue({
            django: '<p>Django descubre tus apps porque las listas explícitamente en <code>INSTALLED_APPS</code>.</p>',
            vue: '<p>Nuxt escanea <code>app/composables/</code> (y <code>app/utils/</code>) al arrancar, y hace disponible cada función exportada <strong>en cualquier componente, sin <code>import</code></strong>.</p>',
          })}
          ${codeBlock('vue', `
<script setup lang="ts">
// nada de "import { useRescueChatMessages } from '~/composables/...'"
// Nuxt ya lo dejó disponible como global dentro de este archivo:
const { messages, asyncStatus } = useRescueChatMessages(rescueId);
</script>
          `)}
          ${calloutTip('Esto es exclusivo de Nuxt (no de Vue puro). Si ves una función <code>useAlgo()</code> usada sin <code>import</code> en un <code>.vue</code>, casi seguro es un auto-import de <code>app/composables/</code> o <code>app/utils/</code>.')}
        `,
      },
      {
        heading: 'Composición en capas',
        bodyHtml: `
          <p>Los composables se llaman entre sí. Ejemplo real: <code>UnlockCountdown.vue</code> usa <code>useRescueUnlockCountdown</code>, que a su vez podría usar otro composable de reloj compartido:</p>
          ${codeBlock('ts', `
// app/components/rescue/UnlockCountdown.vue (script setup)
const { isActive, isExpired, remainingLabel } = useRescueUnlockCountdown(
  () => props.unlockedUntil,
);
          `)}
          <p>El componente no sabe (ni le importa) cómo se calcula el countdown — solo consume el resultado ya reactivo. Esto es composición: capas pequeñas de lógica que se combinan.</p>
        `,
      },
      {
        heading: 'Por qué tantos composables, y cómo se organizan',
        bodyHtml: `
          <p>
            En vez de un archivo gigante de "utils", cada composable resuelve <strong>una sola
            responsabilidad</strong> sobre <strong>un solo dominio</strong> (rescates, créditos,
            catálogos, chat...). Es más fácil de encontrar, probar y reusar que un archivo de 2000
            líneas. El nombre siempre delata qué hace: <code>useRescueChatMessages</code>,
            <code>useCreditUnlockList</code>, <code>useRescueEvidenceList</code>.
          </p>
        `,
      },
    ],
    playground: {
      starterCode: `
const { createApp, ref, computed } = Vue;

// Composable: función que empieza con "use" y usa reactividad por dentro
function useToggle(inicial = false) {
  const valor = ref(inicial);
  function alternar() {
    valor.value = !valor.value;
  }
  return { valor, alternar };
}

function useCounter(inicial = 0) {
  const cuenta = ref(inicial);
  function incrementar(paso = 1) {
    cuenta.value += paso;
  }
  return { cuenta, incrementar };
}

const App = {
  setup() {
    // Composición: el componente combina dos composables
    const { valor: expandido, alternar } = useToggle(false);
    const { cuenta, incrementar } = useCounter(0);

    return { expandido, alternar, cuenta, incrementar };
  },
  template: \`
    <div style="font-family: sans-serif;">
      <button @click="alternar" style="padding:6px 12px; cursor:pointer;">
        {{ expandido ? 'Ocultar' : 'Mostrar' }} detalles
      </button>
      <div v-if="expandido" style="margin-top:10px; padding:10px; background:#eee; border-radius:6px;">
        <p>Cuenta: {{ cuenta }}</p>
        <button @click="incrementar()" style="padding:4px 10px; cursor:pointer;">+1</button>
      </div>
    </div>
  \`,
};

const app = createApp(App);
app.mount(mountEl);

// Reto: crea un tercer composable "useDouble(cuenta)" que devuelva
// un computed con el doble de "cuenta", y muéstralo en el template
`,
      solutionCode: `
const { createApp, ref, computed } = Vue;

function useToggle(inicial = false) {
  const valor = ref(inicial);
  function alternar() {
    valor.value = !valor.value;
  }
  return { valor, alternar };
}

function useCounter(inicial = 0) {
  const cuenta = ref(inicial);
  function incrementar(paso = 1) {
    cuenta.value += paso;
  }
  return { cuenta, incrementar };
}

function useDouble(cuentaRef) {
  const doble = computed(() => cuentaRef.value * 2);
  return { doble };
}

const App = {
  setup() {
    const { valor: expandido, alternar } = useToggle(false);
    const { cuenta, incrementar } = useCounter(0);
    const { doble } = useDouble(cuenta);

    return { expandido, alternar, cuenta, incrementar, doble };
  },
  template: \`
    <div style="font-family: sans-serif;">
      <button @click="alternar" style="padding:6px 12px; cursor:pointer;">
        {{ expandido ? 'Ocultar' : 'Mostrar' }} detalles
      </button>
      <div v-if="expandido" style="margin-top:10px; padding:10px; background:#eee; border-radius:6px;">
        <p>Cuenta: {{ cuenta }} — Doble: {{ doble }}</p>
        <button @click="incrementar()" style="padding:4px 10px; cursor:pointer;">+1</button>
      </div>
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
          question: '¿Qué convención de nombre siguen casi todos los composables de este repo?',
          options: ['Terminan en Composable', 'Están en mayúsculas', 'Empiezan con get', 'Empiezan con use'],
          correctIndex: 3,
          explanation: 'La convención useXxx (useRescueChatMessages, useCreditUnlockList, etc.) es el estándar de Vue/Nuxt para identificar composables.',
        },
        {
          question: '¿Por qué puedes usar useRescueChatMessages() en un .vue sin escribir import?',
          options: [
            'Porque Vue lo incluye por defecto en el lenguaje',
            'No es posible, siempre hace falta el import',
            'Porque Nuxt auto-importa las funciones exportadas desde app/composables/',
            'Porque el archivo se llama igual que la función',
          ],
          correctIndex: 2,
          explanation: 'Nuxt escanea app/composables/ (y app/utils/) al arrancar y expone cada export como global dentro de cualquier .vue del proyecto.',
        },
        {
          question: '¿Por qué UnlockCountdown.vue usa useRescueUnlockCountdown() en vez de calcular el countdown directo en el componente?',
          options: [
            'Por capricho del autor, no hay ninguna razón técnica',
            'Para poder reutilizar y probar esa lógica por separado del componente visual',
            'Porque los componentes no pueden tener lógica',
            'Porque es obligatorio en Vue',
          ],
          correctIndex: 1,
          explanation: 'Sacar la lógica a un composable la hace reutilizable en otros componentes y testeable de forma aislada, sin depender del DOM.',
        },
      ],
    },
  };
})();
