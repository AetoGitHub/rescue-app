(function () {
  const { codeBlock, calloutTip, calloutWarning, djangoVsVue } = window.Learn;

  window.LearnContent = window.LearnContent || {};
  window.LearnContent['pinia-colada'] = {
    id: 'pinia-colada',
    title: 'Pinia + Pinia Colada',
    icon: '🍹',
    estimatedMinutes: 14,
    sections: [
      {
        heading: 'Pinia: estado global',
        bodyHtml: `
          <p>
            Pinia es el gestor de estado global de Vue (el sucesor de Vuex). Sirve para datos que
            varios componentes sin relación directa necesitan compartir — por ejemplo, una caché de
            ubicaciones o jobs de subida de archivos en este repo (<code>app/stores/</code>). Es
            poco usado directamente en rescue-app porque la mayoría de "estado compartido" en
            realidad es <strong>datos del servidor</strong>, y para eso usan Pinia Colada.
          </p>
        `,
      },
      {
        heading: 'Pinia Colada: cache de datos del servidor',
        bodyHtml: `
          ${djangoVsVue({
            django: '<p>Guardas resultados de queries costosas con <code>cache.set(key, valor, timeout)</code> y los invalidas a mano con <code>cache.delete(key)</code> cuando algo cambia.</p>',
            vue: '<p>Pinia Colada hace lo mismo pero automático y reactivo: cada <code>useQuery</code> se cachea por una "key", se revalida solo, y expone estados de carga/error listos para el template.</p>',
          })}
          ${calloutTip('Si conoces React Query o SWR, Pinia Colada es exactamente ese mismo concepto, para Vue/Pinia.')}
        `,
      },
      {
        heading: 'useQuery: el patrón base',
        bodyHtml: `
          ${codeBlock('ts', `
import { useQuery } from '@pinia/colada';

const { data, isLoading, error, refetch } = useQuery({
  key: ['rescue', rescueId],
  query: () => apiFetch(\`/api/rescue/\${rescueId}/\`),
});
          `)}
          <p><code>key</code> identifica la query en caché (si dos componentes piden la misma <code>key</code>, comparten el mismo dato y la misma petición). <code>query</code> es la función que trae los datos.</p>
        `,
      },
      {
        heading: 'useInfiniteQuery: paginación',
        bodyHtml: `
          <p>Ya lo viste en el módulo de TypeScript — es la misma idea de <code>useQuery</code>, pero acumulando "páginas":</p>
          ${codeBlock('ts', `
const { data, hasNextPage, loadNextPage } = useInfiniteQuery({
  key: () => ['rescue-chat-messages', rescueId],
  initialPageParam: null,
  query: ({ pageParam }) => apiFetch(RESCUE_CHAT_MESSAGES_PATH(rescueId), {
    query: buildPaginatedQuery(undefined, pageParam),
  }),
  getNextPageParam: getNextCursorPageParam,
});
          `)}
        `,
      },
      {
        heading: 'useMutation + invalidación de cache',
        bodyHtml: `
          <p>Para <em>cambiar</em> datos (crear, actualizar, borrar) se usa <code>useMutation</code>, y después de que la mutación tiene éxito, se invalida la query afectada para forzar que se vuelva a pedir:</p>
          ${codeBlock('ts', `
import { useMutation, useQueryCache } from '@pinia/colada';

const queryCache = useQueryCache();

const { mutate: cambiarEstado } = useMutation({
  mutation: (payload) => apiFetch(\`/api/rescue/\${payload.id}/estado/\`, {
    method: 'POST',
    body: payload,
  }),
  onSuccess: () => {
    queryCache.invalidateQueries({ key: ['operational-board'] });
  },
});
          `)}
          ${calloutWarning('Sin invalidar la query, la UI seguiría mostrando datos viejos aunque el POST haya funcionado — la caché no sabe que algo cambió del lado del servidor a menos que se lo digas.')}
        `,
      },
      {
        heading: '¿Por qué no simplemente hacer fetch a mano?',
        bodyHtml: `
          <p>
            Podrías, pero perderías: cache compartida entre componentes, deduplicación de peticiones
            idénticas, estados de <code>isLoading</code>/<code>error</code> listos, revalidación
            automática, e invalidación centralizada. Por eso en este repo casi todo fetch de datos
            (salvo casos puntuales como descargar un Excel) pasa por Pinia Colada.
          </p>
        `,
      },
    ],
    playground: {
      starterCode: `
const { createApp, ref } = Vue;

// Mini-useQuery casero: misma FORMA de API que Pinia Colada real
// ({ data, isLoading, error, refetch }), sin cargar la librería real
// (no publica build UMD/global listo para <script> clásico).
function useQuery(fetcher) {
  const data = ref(null);
  const isLoading = ref(false);
  const error = ref(null);

  function refetch() {
    isLoading.value = true;
    error.value = null;
    // simulamos latencia de red con setTimeout
    setTimeout(() => {
      try {
        data.value = fetcher();
      } catch (e) {
        error.value = e;
      } finally {
        isLoading.value = false;
      }
    }, 600);
  }

  refetch(); // se dispara solo, como useQuery real
  return { data, isLoading, error, refetch };
}

function fetchRescates() {
  return [
    { id: 1, folio: 'RES-001', status: 'en_progreso' },
    { id: 2, folio: 'RES-002', status: 'completado' },
  ];
}

const App = {
  setup() {
    const { data: rescates, isLoading, refetch } = useQuery(fetchRescates);
    return { rescates, isLoading, refetch };
  },
  template: \`
    <div style="font-family: sans-serif;">
      <button @click="refetch" style="padding:6px 12px; cursor:pointer;">↻ Recargar</button>
      <p v-if="isLoading">Cargando…</p>
      <ul v-else>
        <li v-for="r in rescates" :key="r.id">{{ r.folio }} — {{ r.status }}</li>
      </ul>
    </div>
  \`,
};

const app = createApp(App);
app.mount(mountEl);

// Reto: agrega un tercer rescate al array que devuelve fetchRescates()
// y presiona "Recargar" para verlo aparecer
`,
      solutionCode: `
const { createApp, ref } = Vue;

function useQuery(fetcher) {
  const data = ref(null);
  const isLoading = ref(false);
  const error = ref(null);

  function refetch() {
    isLoading.value = true;
    error.value = null;
    setTimeout(() => {
      try {
        data.value = fetcher();
      } catch (e) {
        error.value = e;
      } finally {
        isLoading.value = false;
      }
    }, 600);
  }

  refetch();
  return { data, isLoading, error, refetch };
}

function fetchRescates() {
  return [
    { id: 1, folio: 'RES-001', status: 'en_progreso' },
    { id: 2, folio: 'RES-002', status: 'completado' },
    { id: 3, folio: 'RES-003', status: 'pendiente' },
  ];
}

const App = {
  setup() {
    const { data: rescates, isLoading, refetch } = useQuery(fetchRescates);
    return { rescates, isLoading, refetch };
  },
  template: \`
    <div style="font-family: sans-serif;">
      <button @click="refetch" style="padding:6px 12px; cursor:pointer;">↻ Recargar</button>
      <p v-if="isLoading">Cargando…</p>
      <ul v-else>
        <li v-for="r in rescates" :key="r.id">{{ r.folio }} — {{ r.status }}</li>
      </ul>
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
          question: '¿Qué identifica de forma única una query en la caché de Pinia Colada?',
          options: ['El nombre del componente', 'El archivo donde está', 'El orden en que se llamó', 'La key'],
          correctIndex: 3,
          explanation: 'La key es lo que Pinia Colada usa para saber si dos peticiones piden "lo mismo" y compartir el resultado en caché.',
        },
        {
          question: '¿Qué pasa si haces un useMutation exitoso pero no invalidas la query relacionada?',
          options: [
            'Pinia Colada la invalida sola siempre',
            'No pasa nada, es automático',
            'La UI puede seguir mostrando datos desactualizados hasta que algo más dispare un refetch',
            'La app se cae',
          ],
          correctIndex: 2,
          explanation: 'La cache no sabe que el servidor cambió a menos que se le indique explícitamente con invalidateQueries (o un refetch manual).',
        },
        {
          question: '¿Cuál es la diferencia principal entre useQuery y useMutation?',
          options: [
            'No hay diferencia real',
            'useQuery es para leer datos; useMutation es para crear/actualizar/borrar',
            'useMutation es más rápido',
            'useQuery solo funciona con arrays',
          ],
          correctIndex: 1,
          explanation: 'useQuery trae y cachea datos (lecturas); useMutation ejecuta cambios en el servidor y típicamente dispara una invalidación de cache al terminar.',
        },
      ],
    },
  };
})();
