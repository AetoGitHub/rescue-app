(function () {
  const { codeBlock, calloutTip, calloutWarning, djangoVsVue } = window.Learn;

  window.LearnContent = window.LearnContent || {};
  window.LearnContent['cookbook-modales-formularios'] = {
    id: 'cookbook-modales-formularios',
    title: 'Cookbook: modales, formularios y catálogos',
    icon: '📖',
    estimatedMinutes: 20,
    sections: [
      {
        heading: 'Este módulo es el capstone',
        bodyHtml: `
          <p>
            Todo lo que sigue combina Vue (módulo 4), composables (módulo 6), Pinia Colada
            (módulo 7), Zod (módulo 8) y Nuxt UI (módulo 9) para resolver las tareas de
            mantenimiento más comunes en este repo: agregar/editar un modal, agregar un campo a
            un formulario, y replicar una página de catálogo. Todo el código de este módulo es
            real (o una simplificación directa) del repo — no inventado.
          </p>
        `,
      },
      {
        heading: 'Dos patrones para abrir y cerrar un modal o slideover',
        bodyHtml: `
          <p><strong>Patrón A — estado interno + <code>defineExpose</code></strong> (usado en los slideovers "Create" de catálogo, ej. <code>CategoryCreateSlideover.vue</code>): el propio componente controla su visibilidad y expone métodos para que el padre lo abra.</p>
          ${codeBlock('ts', `
// dentro del slideover (hijo)
const open = ref(false);

function prepareCreate() { /* resetea el form */ open.value = true; }
function openEdit(id: number, name: string) { /* precarga datos */ open.value = true; }

defineExpose({ prepareCreate, openEdit });
          `)}
          ${codeBlock('vue', `
<!-- en la página (padre) -->
<CategoryCreateSlideover ref="slideoverRef" />
<!-- ... -->
<script setup lang="ts">
const slideoverRef = ref<{ openEdit: (id: number, name: string) => void } | null>(null);
function onRowSelect(_e: Event, row: TableRow<Category>) {
  slideoverRef.value?.openEdit(row.original.id, row.original.name);
}
</script>
          `)}
          <p><strong>Patrón B — <code>defineModel('open')</code></strong> (usado cuando el padre necesita controlar la visibilidad desde afuera, ej. <code>CategoryManageSlideover.vue</code>, <code>ClientCreditUnlockCreateModal.vue</code>):</p>
          ${codeBlock('ts', `
// dentro del slideover/modal (hijo)
const open = defineModel<boolean>('open', { default: false });
          `)}
          ${codeBlock('vue', `
<!-- en el padre -->
<CatalogCategoryManageSlideover v-model:open="categoriesOpen" />
          `)}
          ${calloutTip('¿Cuál usar? Si SOLO la página que contiene el slideover necesita abrirlo (el caso típico de "crear"), usa el patrón A. Si varias partes de la UI necesitan leer/controlar si está abierto, usa el patrón B.')}
          <p>
            Ambos patrones envuelven el <code>open</code> real con el composable
            <code>useDiscardChangesGuard</code>: si el usuario intenta cerrar el modal con cambios
            sin guardar, muestra una confirmación (<code>SharedDiscardChangesConfirmModal</code>) en
            vez de cerrar directo y perder lo escrito.
          </p>
        `,
      },
      {
        heading: 'Anatomía completa de un slideover de crear/editar',
        bodyHtml: `
          <p>Ejemplo real simplificado de <code>CategoryCreateSlideover.vue</code>:</p>
          ${codeBlock('ts', `
const { mutate, asyncStatus } = useMutation({
  mutation: ({ body, id }: { body: CategoryCreateBody | CategoryUpdateBody; id: number | null }) =>
    id != null
      ? $fetch(\`/api/catalogue/multipurpose/update/\${id}/\`, { method: 'PUT', body })
      : $fetch('/api/catalogue/multipurpose/create/', { method: 'POST', body }),
  async onSuccess() {
    toast.add({ title: wasEdit ? props.successEditLabel : props.successCreateLabel, color: 'success' });
    await queryCache.invalidateQueries({ key: ['catalog-multipurpose', props.catalogueType] });
    closeWithoutConfirm();
    resetForm();
  },
  onError: (e) => toast.add({ title: 'No se pudo guardar', description: getFetchErrorMessage(e), color: 'error' }),
});
          `)}
          ${codeBlock('vue', `
<USlideover v-model:open="guardedOpen" :dismissible="!isSaving" :title="slideoverTitle">
  <UButton v-if="showTrigger" icon="i-lucide-plus" :label="newItemLabel" @click="prepareCreate" />

  <template #body>
    <UForm ref="formRef" :schema="categoryCreateSchema" :state="state" @submit="onSubmit" @error="onFormError">
      <UFormField label="Nombre" name="name" required>
        <UInput :model-value="state.name" class="w-full uppercase" />
      </UFormField>
    </UForm>
  </template>

  <template #footer>
    <UButton label="Cancelar" @click="cancel" />
    <UButton label="Guardar" :loading="isSaving" @click="requestSubmit" />
  </template>
</USlideover>
          `)}
          ${calloutWarning('El botón "Guardar" del footer NO está dentro del &lt;form&gt; (vive en el slot #footer, fuera de UForm) — por diseño de layout de USlideover. Por eso se dispara con requestSubmit(), que internamente llama formRef.value?.submit(). Si copias este patrón y tu botón de guardar no hace nada al hacer click, revisa justo esto.')}
          <p>Toda mutación exitosa sigue el mismo cierre: mostrar un <code>toast</code>, invalidar la query de Pinia Colada afectada (módulo 7), y cerrar/resetear el formulario.</p>
        `,
      },
      {
        heading: 'Cómo agregar un campo a un formulario existente',
        bodyHtml: `
          <p>Pasos, en orden, usando <code>serviceCreateSchema</code> real como referencia:</p>
          ${codeBlock('ts', `
// 1) app/schemas/catalog-create.ts — agrega la key al schema
export const serviceCreateSchema = z.object({
  name: catalogNameField('El nombre'),
  description: z.string().transform((s) => s.trim()).default(''),
  category: requiredCatalogSelection('Selecciona una categoría'),
  unit: z.enum(SERVICE_UNIT_VALUES, { error: 'Selecciona una unidad' }),
  warranty: z.boolean(),          // <- campo nuevo, por ejemplo
});
          `)}
          <ol>
            <li><strong>Schema</strong>: agrega la key con su validador Zod (arriba, <code>warranty</code>).</li>
            <li><strong>State</strong>: agrega el valor por defecto en el <code>emptyState()</code> del componente.</li>
            <li><strong>UFormField</strong>: el <code>name</code> debe coincidir <em>exactamente</em> con la key del schema, para que el error se pinte en el campo correcto.</li>
            <li><strong>Control concreto</strong>, según el tipo de dato:</li>
          </ol>
          ${codeBlock('vue', `
<UFormField label="Nombre" name="name"><UInput v-model="state.name" /></UFormField>
<UFormField label="Unidad" name="unit"><USelectMenu v-model="state.unit" :items="[...SERVICE_UNIT_OPTIONS]" value-key="value" /></UFormField>
<UFormField label="Con garantía" name="warranty"><UCheckbox v-model="state.warranty" /></UFormField>
<UFormField label="Descripción" name="description"><UTextarea v-model="state.description" /></UFormField>
<UFormField label="Categoría" name="category"><CatalogDropdownSelect v-model="state.category" fetch-path="/api/catalogue/multipurpose/dropdown/" /></UFormField>
          `)}
          <p><code>CatalogDropdownSelect</code> es el control para relaciones tipo FK (busca/selecciona un registro de otro catálogo, con autocompletado remoto) — úsalo cuando el campo nuevo referencie otra entidad, no un valor fijo.</p>
        `,
      },
      {
        heading: 'El patrón de página CRUD de catálogo',
        bodyHtml: `
          <p>Todas las páginas de catálogo (<code>categories</code>, <code>clients</code>, <code>services</code>, <code>suppliers</code>, <code>companies</code>...) comparten el mismo esqueleto:</p>
          ${codeBlock('ts', `
const { rows, asyncStatus, hasNextPage, loadNextPage, isInitialLoading } =
  useCatalogInfiniteList<Entity>({
    key: () => ['entity-name', ...filtros],
    path: '/api/catalogue/entity/list/',
    query: () => ({ /* filtros opcionales */ }),
  });

usePaginatedTableInfiniteScroll({ tableRef, hasNextPage, loadNextPage, asyncStatus });
          `)}
          <p>
            <code>useCatalogInfiniteList</code> recibe <code>key</code> (para el cache de Pinia
            Colada), <code>path</code> (el endpoint del proxy) y <code>query</code> (filtros
            reactivos), y devuelve <code>rows</code> (ya aplanado, listo para <code>UTable</code>),
            <code>asyncStatus</code>, <code>hasNextPage</code>, <code>loadNextPage</code> e
            <code>isInitialLoading</code> — es literalmente <code>useInfiniteQuery</code> (módulo
            7) con la paginación ya resuelta para tablas de catálogo.
          </p>
          ${codeBlock('vue', `
<AdminListPageShell navbar-title="..." title="..." description="...">
  <template #actions><CatalogXCreateSlideover ref="slideoverRef" /></template>
  <template #filters><UInput ... /> <UButton ... /></template>
  <UTable ref="table" sticky :columns :data="rows" :loading="isInitialLoading" @select="onRowSelect" />
</AdminListPageShell>
          `)}
          <p><strong>Para agregar un catálogo nuevo:</strong></p>
          <ul>
            <li><strong>Solo un campo (nombre)</strong>: copia <code>categories/index.vue</code> y reutiliza <code>CategoryCreateSlideover</code>/<code>CategoryManageSlideover</code> cambiando el <code>catalogue-type</code> — así es como <code>categories</code> y <code>cancellation-reasons</code> comparten el mismo componente. Es el catálogo "multipropósito": una sola tabla en Django, distinguida por <code>type</code>.</li>
            <li><strong>Con campos propios</strong>: copia <code>companies/index.vue</code> (el más simple de los que tienen entidad propia en Django) junto con su slideover, y ajusta el <code>path</code>, las columnas y el schema.</li>
          </ul>
        `,
      },
      {
        heading: 'Tarea de 2 minutos: agregar una opción a un select fijo',
        bodyHtml: `
          <p>Para opciones de un dominio cerrado (no un catálogo editable en base de datos), se editan dos arrays en el mismo archivo de constantes:</p>
          ${codeBlock('ts', `
// app/constants/catalog-select-options.ts
export const SERVICE_UNIT_VALUES = [
  'service', 'hour', 'piece', 'km', 'day', 'other',
  // 'week',  <- agregarías aquí el valor nuevo
] as const;

export const SERVICE_UNIT_OPTIONS = [
  { label: 'Servicio', value: 'service' },
  { label: 'Hora', value: 'hour' },
  { label: 'Pieza', value: 'piece' },
  { label: 'Km', value: 'km' },
  { label: 'Día', value: 'day' },
  { label: 'Otro', value: 'other' },
  // { label: 'Semana', value: 'week' },  <- y aquí, con su label visible
] as const;
          `)}
          <p><code>_VALUES</code> es lo que valida el <code>z.enum(...)</code> del schema; <code>_OPTIONS</code> es lo que se muestra en el <code>USelectMenu</code>. Si solo agregas uno de los dos, o el select no muestra la opción nueva, o Zod rechaza un valor que sí aparece en pantalla — necesitas ambos, siempre en sincronía.</p>
        `,
      },
    ],
    playground: {
      starterCode: `
const { createApp, ref } = Vue;

// EditModal: el mecanismo real de defineModel('open'), pero escrito "largo"
// (props + emit explícitos) porque el playground no compila <script setup>.
// defineModel('open') en el proyecto real hace exactamente esto por ti.
const EditModal = {
  props: ['modelValue', 'nombreInicial'],
  emits: ['update:modelValue', 'save'],
  data() {
    return { nombre: this.nombreInicial, guardando: false };
  },
  methods: {
    cerrar() {
      this.$emit('update:modelValue', false);
    },
    async guardar() {
      this.guardando = true;
      await new Promise((r) => setTimeout(r, 600)); // simula la mutación (useMutation real)
      this.guardando = false;
      this.$emit('save', this.nombre);
      this.cerrar();
    },
  },
  template: \`
    <div v-if="modelValue" style="position:absolute; inset:0; background:rgba(0,0,0,.45); display:flex; align-items:center; justify-content:center;">
      <div style="background:white; color:#111; padding:20px; border-radius:8px; min-width:240px;">
        <h3 style="margin-top:0;">Editar categoría</h3>
        <input v-model="nombre" style="width:100%; padding:6px; margin-bottom:12px; box-sizing:border-box;" />
        <div style="display:flex; gap:8px; justify-content:flex-end;">
          <button @click="cerrar">Cancelar</button>
          <button @click="guardar" :disabled="guardando">{{ guardando ? 'Guardando…' : 'Guardar' }}</button>
        </div>
      </div>
    </div>
  \`,
};

const App = {
  components: { EditModal },
  setup() {
    const abierto = ref(false);
    const nombreGuardado = ref('Grúas');
    function onSave(nuevoNombre) {
      nombreGuardado.value = nuevoNombre;
    }
    return { abierto, nombreGuardado, onSave };
  },
  template: \`
    <div style="font-family: sans-serif; position:relative; min-height:160px;">
      <p>Categoría actual: <strong>{{ nombreGuardado }}</strong></p>
      <button @click="abierto = true">Editar</button>
      <edit-modal v-model="abierto" :nombre-inicial="nombreGuardado" @save="onSave" />
    </div>
  \`,
};

const app = createApp(App);
app.mount(mountEl);

// Reto: agrega un botón "Eliminar" dentro del modal que, al presionarlo,
// ponga nombreGuardado.value = '(sin categoría)' y cierre el modal
`,
      solutionCode: `
const { createApp, ref } = Vue;

const EditModal = {
  props: ['modelValue', 'nombreInicial'],
  emits: ['update:modelValue', 'save', 'delete'],
  data() {
    return { nombre: this.nombreInicial, guardando: false };
  },
  methods: {
    cerrar() {
      this.$emit('update:modelValue', false);
    },
    async guardar() {
      this.guardando = true;
      await new Promise((r) => setTimeout(r, 600));
      this.guardando = false;
      this.$emit('save', this.nombre);
      this.cerrar();
    },
    eliminar() {
      this.$emit('delete');
      this.cerrar();
    },
  },
  template: \`
    <div v-if="modelValue" style="position:absolute; inset:0; background:rgba(0,0,0,.45); display:flex; align-items:center; justify-content:center;">
      <div style="background:white; color:#111; padding:20px; border-radius:8px; min-width:240px;">
        <h3 style="margin-top:0;">Editar categoría</h3>
        <input v-model="nombre" style="width:100%; padding:6px; margin-bottom:12px; box-sizing:border-box;" />
        <div style="display:flex; gap:8px; justify-content:space-between;">
          <button @click="eliminar" style="color:#b3392f;">Eliminar</button>
          <div style="display:flex; gap:8px;">
            <button @click="cerrar">Cancelar</button>
            <button @click="guardar" :disabled="guardando">{{ guardando ? 'Guardando…' : 'Guardar' }}</button>
          </div>
        </div>
      </div>
    </div>
  \`,
};

const App = {
  components: { EditModal },
  setup() {
    const abierto = ref(false);
    const nombreGuardado = ref('Grúas');
    function onSave(nuevoNombre) {
      nombreGuardado.value = nuevoNombre;
    }
    function onDelete() {
      nombreGuardado.value = '(sin categoría)';
    }
    return { abierto, nombreGuardado, onSave, onDelete };
  },
  template: \`
    <div style="font-family: sans-serif; position:relative; min-height:160px;">
      <p>Categoría actual: <strong>{{ nombreGuardado }}</strong></p>
      <button @click="abierto = true">Editar</button>
      <edit-modal v-model="abierto" :nombre-inicial="nombreGuardado" @save="onSave" @delete="onDelete" />
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
          question: '¿Cuándo conviene el patrón A (ref interno + defineExpose) sobre el patrón B (defineModel)?',
          options: [
            'Cuando solo la página que contiene el slideover necesita abrirlo/cerrarlo',
            'Nunca, siempre hay que usar defineModel',
            'Solo funciona con USlideover, nunca con UModal',
            'Cuando el formulario no tiene validación',
          ],
          correctIndex: 0,
          explanation: 'El patrón A es más simple cuando el control de apertura es local a una sola página; el patrón B (v-model:open) es para cuando varias partes de la UI necesitan leer o controlar la visibilidad.',
        },
        {
          question: 'El botón "Guardar" vive en el slot #footer, fuera del <UForm>. ¿Cómo se dispara entonces el submit del formulario?',
          options: [
            'No se puede, es un bug del framework',
            'Recargando la página',
            'Con requestSubmit(), que llama formRef.value?.submit() sobre la referencia al UForm',
            'Automáticamente cada 2 segundos',
          ],
          correctIndex: 2,
          explanation: 'Al estar fuera del <form>, un click normal no lo dispara — por eso se guarda una referencia (formRef) al UForm y se llama su método .submit() manualmente.',
        },
        {
          question: '¿Qué evita useDiscardChangesGuard?',
          options: [
            'Errores de red',
            'Que dos usuarios editen lo mismo a la vez',
            'Errores de TypeScript',
            'Que el usuario cierre un modal/slideover con cambios sin guardar sin confirmar antes',
          ],
          correctIndex: 3,
          explanation: 'Envuelve el estado "open" real y muestra un modal de confirmación antes de cerrar si hay cambios sin guardar, en vez de perderlos silenciosamente.',
        },
        {
          question: 'Al agregar un campo nuevo a un formulario, ¿qué debe coincidir exactamente para que Zod pinte el error en el campo correcto?',
          options: [
            'El color del UInput',
            'No hace falta que coincida nada',
            'El orden de los campos en el template',
            'El name del UFormField con la key del schema de Zod',
          ],
          correctIndex: 3,
          explanation: 'UForm conecta los issues de Zod con el campo correspondiente usando el name de cada UFormField — si no coincide con la key del schema, el error no se muestra donde debería.',
        },
        {
          question: 'Quieres agregar un catálogo nuevo que solo necesita un campo "nombre". ¿Qué es lo más rápido de reutilizar?',
          options: [
            'Escribir un slideover completamente nuevo desde cero',
            'Modificar directamente la base de datos de Django',
            'Copiar categories/index.vue y reutilizar CategoryCreateSlideover/CategoryManageSlideover cambiando el catalogue-type',
            'No se puede agregar un catálogo nuevo sin tocar el backend',
          ],
          correctIndex: 2,
          explanation: 'El catálogo "multipropósito" (categories, cancellation-reasons, etc.) comparte una sola tabla en Django distinguida por "type", así que agregar uno nuevo de un solo campo es cuestión de reutilizar el mismo componente con otro catalogue-type.',
        },
        {
          question: 'Agregas una opción nueva solo al array _OPTIONS de catalog-select-options.ts pero no a _VALUES. ¿Qué va a pasar?',
          options: [
            'Todo funciona perfecto',
            'La app deja de compilar inmediatamente',
            'Se agrega automáticamente a _VALUES',
            'La opción aparece en el select, pero Zod la rechaza al enviar el formulario porque no está en el enum',
          ],
          correctIndex: 3,
          explanation: '_VALUES alimenta el z.enum() que valida; _OPTIONS solo controla qué se muestra en el UI. Ambos arrays deben mantenerse en sincronía manualmente.',
        },
      ],
    },
  };
})();
