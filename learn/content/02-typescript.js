(function () {
  const { codeBlock, calloutTip, calloutWarning, djangoVsVue } = window.Learn;

  window.LearnContent = window.LearnContent || {};
  window.LearnContent['typescript'] = {
    id: 'typescript',
    title: 'TypeScript básico',
    icon: '🔷',
    estimatedMinutes: 12,
    sections: [
      {
        heading: 'Tipos básicos e interfaces',
        bodyHtml: `
          ${djangoVsVue({
            django: '<p>Type hints opcionales, casi siempre ignorados en tiempo de ejecución: <code>def get(self, pk: int) -&gt; Rescue: ...</code></p>',
            vue: '<p>TypeScript es obligatorio en todo el repo y se revisa antes de compilar (<code>pnpm typecheck</code>, <code>vue-tsc</code>). Si el tipo no cuadra, no compila.</p>',
          })}
          ${codeBlock('ts', `
// tipos primitivos
let total: number = 10;
let nombre: string = 'Ana';
let activo: boolean = true;

// interface: la forma de un objeto (como un dataclass sin comportamiento)
interface RescueChatMessage {
  id: number;
  type: 'user' | 'system';
  text: string;
  created_by_id: number | null;
  created_by_name: string | null;
}
          `)}
          <p>Este ejemplo es (casi) literal de <code>app/interfaces/rescue/chat.ts</code>. Fíjate en <code>number | null</code>: significa "número o null", nunca "cualquier otra cosa".</p>
        `,
      },
      {
        heading: 'Props tipadas sin runtime: defineProps<{...}>()',
        bodyHtml: `
          <p>Así se ven las props de un componente en este repo (de <code>UnlockCountdown.vue</code> real):</p>
          ${codeBlock('ts', `
const props = withDefaults(
  defineProps<{
    unlockedUntil: string | null | undefined;
    compact?: boolean;          // el "?" significa opcional
    showExpiredHint?: boolean;
    expiredHint?: string;
  }>(),
  {
    compact: false,
    showExpiredHint: true,
    expiredHint: 'Tiempo agotado; guarda tus cambios',
  },
);
          `)}
          <p>
            <code>defineProps&lt;{...}&gt;()</code> (con los tipos entre <code>&lt; &gt;</code>) es la forma <strong>sin runtime</strong>:
            Vue lee esos tipos en tiempo de compilación para generar la validación, en vez de que tú
            escribas un objeto de configuración a mano (<code>defineProps({ compact: Boolean })</code>,
            la forma "con runtime", que también existe pero no es la que usa este repo).
          </p>
          ${calloutTip('<code>withDefaults(defineProps&lt;...&gt;(), {...})</code> es el patrón para poner valores por defecto en props opcionales tipadas.')}
        `,
      },
      {
        heading: 'Generics básicos',
        bodyHtml: `
          <p>Un generic es un "tipo con un parámetro" — como una función que recibe un tipo en vez de (o además de) un valor. Se usan constantemente en los composables.</p>
          ${codeBlock('ts', `
interface PaginatedResponse<T> {
  results: T[];
  next: string | null;
}

// "T" se reemplaza según cómo lo uses:
function primero<T>(lista: T[]): T | undefined {
  return lista[0];
}

primero<number>([1, 2, 3]);     // T = number
primero<string>(['a', 'b']);    // T = string

// ejemplo real: useInfiniteQuery<PaginatedResponse<RescueChatMessage>, Error, string | null>({...})
          `)}
        `,
      },
      {
        heading: 'MaybeRefOrGetter<T> y toValue()',
        bodyHtml: `
          <p>Un patrón que vas a ver en casi todos los composables de este repo. Ejemplo real de <code>useRescueChatMessages.ts</code>:</p>
          ${codeBlock('ts', `
import type { MaybeRefOrGetter } from 'vue';

export function useRescueChatMessages(rescueId: MaybeRefOrGetter<number | null>) {
  const id = computed(() => toValue(rescueId));
  // ...
}
          `)}
          <p>
            <code>MaybeRefOrGetter&lt;number | null&gt;</code> significa: "acepta un <code>number | null</code> directo,
            O un <code>ref</code> que lo contiene, O una función que lo devuelve". <code>toValue(x)</code> normaliza
            cualquiera de las tres formas al valor plano. Esto permite que el composable sea flexible: lo puedes
            llamar con un número fijo, con un <code>ref</code> reactivo, o con un <code>computed</code>.
          </p>
        `,
      },
      {
        heading: 'Union types y unknown vs any',
        bodyHtml: `
          ${codeBlock('ts', `
type RescueChatMessageType = 'user' | 'system'; // solo puede ser uno de estos dos strings

function describirTipo(tipo: RescueChatMessageType) {
  if (tipo === 'system') return 'Mensaje del sistema';
  return 'Mensaje de usuario'; // TS sabe que aquí solo puede ser 'user'
}
          `)}
          ${calloutWarning('Evita <code>any</code> (apaga el chequeo de tipos por completo). Si de verdad no sabes el tipo, usa <code>unknown</code>: obliga a verificar antes de usarlo, mucho más seguro.')}
        `,
      },
    ],
    typeExercise: {
      prompt: 'Completa la interfaz para las props de un componente <code>RescueBadge</code> que recibe: <code>label</code> (string, obligatorio), <code>color</code> (uno de <code>"info" | "warning" | "success"</code>, opcional), y <code>compact</code> (boolean, opcional). Usa el mismo formato que <code>defineProps&lt;{...}&gt;()</code> visto arriba.',
      starterCode: `defineProps<{
  // completa aquí
}>();`,
      solutionCode: `defineProps<{
  label: string;
  color?: 'info' | 'warning' | 'success';
  compact?: boolean;
}>();`,
    },
    quiz: {
      passThreshold: 0.7,
      questions: [
        {
          question: 'En interface RescueChatMessage { created_by_id: number | null }, ¿qué valores acepta created_by_id?',
          options: [
            'Solo números',
            'Solo null',
            'Cualquier cosa',
            'Números o null, nada más',
          ],
          correctIndex: 3,
          explanation: 'number | null es un union type: el valor debe ser exactamente uno de los dos tipos listados.',
        },
        {
          question: '¿Qué significa el "?" en compact?: boolean dentro de defineProps<{...}>()?',
          options: [
            'Que la prop es opcional',
            'Que la prop es de tipo pregunta',
            'Que la prop es obligatoria',
            'No tiene ningún efecto',
          ],
          correctIndex: 0,
          explanation: 'El "?" marca la propiedad como opcional: el componente puede recibirla o no.',
        },
        {
          question: '¿Para qué sirve toValue(rescueId) cuando rescueId es MaybeRefOrGetter<number | null>?',
          options: [
            'Convierte el valor a string',
            'Valida que el número sea positivo',
            'Normaliza un valor plano, un ref o un getter a su valor actual',
            'Crea un nuevo ref',
          ],
          correctIndex: 2,
          explanation: 'toValue() acepta cualquiera de las tres formas (valor directo, ref, o función getter) y siempre devuelve el valor plano actual.',
        },
        {
          question: '¿Cuál es la diferencia principal entre any y unknown?',
          options: [
            'Son exactamente lo mismo',
            'any solo funciona con números, unknown con cualquier tipo',
            'unknown obliga a verificar el tipo antes de usarlo; any desactiva el chequeo por completo',
            'unknown es más lento en tiempo de ejecución',
          ],
          correctIndex: 2,
          explanation: 'unknown es seguro: TypeScript te obliga a comprobar el tipo (con un narrowing) antes de operar sobre el valor. any renuncia por completo al chequeo de tipos.',
        },
      ],
    },
  };
})();
