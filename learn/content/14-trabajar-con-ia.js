(function () {
  const { codeBlock, calloutTip, calloutWarning } = window.Learn;

  window.LearnContent = window.LearnContent || {};
  window.LearnContent['trabajar-con-ia'] = {
    id: 'trabajar-con-ia',
    title: 'Cómo pedirle bien cambios a la IA',
    icon: '🤖',
    estimatedMinutes: 15,
    sections: [
      {
        heading: 'El frontend dev se fue — ahora la IA es tu par, no tu reemplazo',
        bodyHtml: `
          <p>
            Vas a apoyarte en IA para escribir buena parte del código de este frontend — es
            razonable, y con todo lo que ya viste en esta guía estás en posición de <strong>dirigir</strong>
            ese trabajo en vez de solo aceptarlo. Este módulo junta todo lo anterior en algo muy
            concreto: qué contexto darle a la IA, qué pedirle exactamente, y qué revisar antes de
            dar por bueno lo que te entregue.
          </p>
          ${calloutTip('Regla general: entre más específico el prompt sobre los PATRONES de este repo (no solo "qué" quieres, sino "cómo se hace aquí"), menos vas a tener que corregir después.')}
        `,
      },
      {
        heading: 'Checklist de contexto: menciónalo siempre',
        bodyHtml: `
          <p>Antes de pedir código nuevo, dale a la IA (o recuérdate a ti mismo) estas restricciones del proyecto:</p>
          <ul>
            <li><strong>Stack</strong>: Nuxt 4 + Vue 3, Composition API, <code>&lt;script setup lang="ts"&gt;</code> — nunca Options API, nunca JavaScript sin tipos.</li>
            <li><strong>UI</strong>: usa componentes de <strong>Nuxt UI</strong> (<code>UButton</code>, <code>UForm</code>, <code>UTable</code>...) — no crear botones/inputs/modales desde cero con HTML plano.</li>
            <li><strong>Listas paginadas</strong>: sigue el patrón <code>useCatalogInfiniteList</code> + <code>AdminListPageShell</code> + <code>UTable</code> (módulo cookbook), no armar paginación a mano.</li>
            <li><strong>Auto-imports</strong>: los composables de <code>app/composables/</code> y utils de <code>app/utils/</code> NO se importan explícitamente — si la IA agrega un <code>import</code> para uno de estos, sóbralo.</li>
            <li><strong>Datos del servidor</strong>: siempre vía Pinia Colada (<code>useQuery</code>/<code>useMutation</code>), nunca <code>fetch</code>/<code>axios</code> sueltos salvo casos ya establecidos (ej. descarga de un Excel).</li>
            <li><strong>Validación</strong>: esquemas Zod en <code>app/schemas/</code>, usados con <code>UForm</code>/<code>UFormField</code>.</li>
          </ul>
        `,
      },
      {
        heading: 'Plantillas de prompt listas para copiar',
        bodyHtml: `
          <p><strong>1) Agregar un modal/slideover para editar algo:</strong></p>
          ${codeBlock('text', `
Necesito un modal de editar para [entidad] en este proyecto Nuxt 4 + Vue 3.
Usa el mismo patrón que app/components/catalog/CategoryCreateSlideover.vue:
USlideover + UForm con un schema de Zod + useMutation de Pinia Colada que
invalide la query ['[nombre-de-la-query]'] al terminar, con toast de éxito/error.
El botón "Guardar" va en el slot #footer y se dispara con formRef.value?.submit().
Los campos son: [lista de campos y su tipo].
          `)}
          <p><strong>2) Agregar un campo a un formulario existente:</strong></p>
          ${codeBlock('text', `
Agrega el campo "[nombre_campo]" (tipo: [string/número/booleano/selección]) al
formulario de [Componente].vue. Necesito: 1) la validación Zod correspondiente
en app/schemas/[archivo].ts, 2) el valor por defecto en el estado del formulario,
3) el UFormField con name="[nombre_campo]" usando el control de Nuxt UI que
corresponda al tipo. Sigue exactamente las convenciones ya usadas en ese archivo.
          `)}
          <p><strong>3) Agregar una página de catálogo nueva:</strong></p>
          ${codeBlock('text', `
Quiero un catálogo nuevo de [entidad] en app/pages/admin/catalogs/[entidad]/index.vue.
Cópialo del patrón de app/pages/admin/catalogs/companies/index.vue (usa
useCatalogInfiniteList + usePaginatedTableInfiniteScroll + AdminListPageShell +
UTable) y su slideover de creación. El endpoint es /api/catalogue/[entidad]/list/
y los campos son: [lista].
          `)}
          <p><strong>4) Solo entender, sin tocar nada:</strong></p>
          ${codeBlock('text', `
Explícame qué hace app/composables/use[Nombre].ts, línea por línea, sin
proponer cambios. Dime también qué otros archivos lo usan y para qué.
          `)}
          <p><strong>5) Pedir verificación contra un patrón real:</strong></p>
          ${codeBlock('text', `
Antes de darlo por bueno, compara el componente que acabas de escribir contra
app/components/catalog/ServiceCreateSlideover.vue y dime explícitamente si hay
alguna diferencia de patrón (estructura del schema, manejo de errores, cómo
invalida cache, etc.) y por qué.
          `)}
        `,
      },
      {
        heading: 'Señales de alerta en código generado por IA',
        bodyHtml: `
          <p>Un fragmento con varios problemas típicos, para que aprendas a detectarlos a simple vista:</p>
          ${codeBlock('vue', `
<script>
import { useRescueChatMessages } from '~/composables/useRescueChatMessages';

export default {
  data() {
    return { mensajes: [], cargando: false };
  },
  async mounted() {
    this.cargando = true;
    const res = await fetch('/api/rescue/1/chat/messages/');
    this.mensajes = await res.json();
    this.cargando = false;
  },
  methods: {
    async enviar(texto) {
      await fetch('/api/rescue/1/chat/messages/', {
        method: 'POST',
        body: JSON.stringify({ text: texto }),
      });
    },
  },
};
</script>
          `)}
          <ul>
            <li><strong>Options API</strong> (<code>data()</code>, <code>methods</code>, <code>mounted()</code>) — este repo usa <strong>solo</strong> Composition API con <code>&lt;script setup lang="ts"&gt;</code>.</li>
            <li><strong>Import manual</strong> de un composable que debería auto-importarse.</li>
            <li><strong><code>fetch()</code> directo</strong> en vez de <code>useApiFetch()</code> + Pinia Colada (pierdes cache, loading state, deduplicación — módulo 7).</li>
            <li><strong>Sin invalidar cache</strong> después de "enviar" — otra parte de la UI que muestre esos mensajes quedaría desactualizada.</li>
            <li><strong>Sin tipos</strong> — nada está tipado, ni el payload ni la respuesta.</li>
            <li><strong>Sin manejo de errores</strong> — si el <code>fetch</code> falla, no hay <code>toast</code> ni mensaje al usuario.</li>
          </ul>
          ${calloutWarning('Un componente de Nuxt UI que "suena real" pero no existe (ej. inventarse un <code>UDataTable</code> quimérico) es una alucinación clásica. Si no lo reconoces de esta guía o de un archivo real del repo, búscalo antes de confiar en que existe.')}
        `,
      },
      {
        heading: 'Cómo verificar lo que te entregó la IA',
        bodyHtml: `
          <ol>
            <li><code>pnpm typecheck</code> — si algo no tipa, ya sabes que algo está mal antes de siquiera abrir el navegador (módulo primeros pasos).</li>
            <li><code>pnpm lint</code> — atrapa convenciones de estilo y varios errores comunes.</li>
            <li><strong>Pruébalo en el navegador</strong> — el golden path (el caso normal) y al menos un caso raro (campo vacío, sin permisos, sin conexión).</li>
            <li><strong>Compáralo estructuralmente</strong> contra un componente real similar (ej. si es un slideover de catálogo, ábrelo junto a <code>CategoryCreateSlideover.vue</code> y revisa que el "esqueleto" coincida: mutation + invalidación + toast + schema + UForm).</li>
          </ol>
          <p>No necesitas entender cada línea para poder mantener este proyecto — pero sí necesitas reconocer cuándo algo <em>no sigue el patrón del repo</em>, y eso es exactamente lo que esta guía te dio.</p>
        `,
      },
    ],
    quiz: {
      passThreshold: 0.7,
      questions: [
        {
          question: 'En el fragmento de la sección anterior, ¿cuál es el problema MÁS relevante del método mounted()?',
          options: [
            'El nombre "mounted" está mal escrito',
            'No tiene ningún problema',
            'Usa Options API y fetch() directo en vez de Composition API + Pinia Colada, perdiendo cache y loading state',
            'Falta un console.log',
          ],
          correctIndex: 2,
          explanation: 'Ese fragmento mezcla dos desviaciones grandes de las convenciones del repo: Options API en vez de Composition API, y fetch manual en vez de la capa de Pinia Colada ya establecida.',
        },
        {
          question: '¿Por qué es un problema que el código importe manualmente un composable como useRescueChatMessages?',
          options: [
            'No es un problema, siempre hay que importar todo explícitamente',
            'Porque rompe el build siempre',
            'Porque los composables no se pueden importar nunca',
            'Porque en este repo los composables de app/composables/ se auto-importan; un import manual sobra y delata que el código no sigue la convención local',
          ],
          correctIndex: 3,
          explanation: 'No rompe nada funcionalmente, pero es una señal de que el código no fue escrito siguiendo las convenciones de auto-import de este proyecto específico.',
        },
        {
          question: 'Después de que una mutación (crear/editar/borrar) tiene éxito, ¿qué paso es fácil que la IA se salte y hay que revisar siempre?',
          options: [
            'Cerrar la ventana del navegador',
            'Recargar la página entera',
            'Invalidar la query de Pinia Colada afectada, para que la UI se actualice con los datos nuevos',
            'Ninguno, las mutaciones no requieren pasos adicionales',
          ],
          correctIndex: 2,
          explanation: 'Sin invalidar la query correspondiente, la cache no se entera de que el servidor cambió, y otras partes de la pantalla siguen mostrando datos viejos.',
        },
        {
          question: '¿Qué deberías hacer si un código generado por IA usa un componente de Nuxt UI que no reconoces?',
          options: [
            'Asumir que existe y seguir adelante',
            'Verificar que ese componente exista de verdad (en la guía, en el repo, o en la documentación de Nuxt UI) antes de confiar en él',
            'Borrarlo automáticamente sin revisar',
            'Reportarlo como bug de Nuxt UI',
          ],
          correctIndex: 1,
          explanation: 'Inventarse un componente que suena plausible es una alucinación común — vale la pena confirmar que existe antes de asumir que el código va a funcionar.',
        },
        {
          question: '¿Cuáles son los dos comandos que deberías correr para verificar cualquier cambio, generado por IA o no, antes de darlo por bueno?',
          options: [
            'pnpm build y pnpm generate',
            'No hace falta correr nada si "se ve bien"',
            'pnpm install y pnpm dev',
            'pnpm typecheck y pnpm lint',
          ],
          correctIndex: 3,
          explanation: 'typecheck atrapa errores de tipos antes de tocar el navegador, y lint atrapa convenciones de estilo y varios errores comunes — ambos son rápidos y deberían ser el primer filtro.',
        },
      ],
    },
  };
})();
