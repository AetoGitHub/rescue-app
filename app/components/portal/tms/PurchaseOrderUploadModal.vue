<script setup lang="ts">
import type { Form, FormSubmitEvent } from '@nuxt/ui';
import type {
  TmsPurchaseOrderAssignment,
  TmsRescue,
} from '~/interfaces/portals/tms';
import {
  tmsPurchaseOrderUploadSchema,
  type TmsPurchaseOrderUploadState,
} from '~/schemas/tms-portal';
import {
  TMS_PURCHASE_ORDER_MAX_FILE_BYTES,
  TMS_PURCHASE_ORDER_MAX_FILES,
} from '~/constants/tms-portal-api';

const props = defineProps<{
  rescues: TmsRescue[];
}>();

const emit = defineEmits<{
  assign: [payload: { rescueId: number; url: string }];
}>();

const STATUS_WEIGHT: Record<TmsPurchaseOrderAssignment['status'], number> = {
  failed: 0,
  blocked: 1,
  ambiguous: 2,
  unmatched: 3,
  assigned: 4,
};

const open = ref(false);
const formRef = useTemplateRef<Form<TmsPurchaseOrderUploadState>>('formRef');
const state = reactive<TmsPurchaseOrderUploadState>({ files: [] });
const assignments = ref<TmsPurchaseOrderAssignment[]>([]);
const submittedFiles = ref<File[]>([]);
const jobStore = useTmsPurchaseOrderJobStore();

const isSubmitting = computed(() => jobStore.submitting);
const isJobActive = computed(() => jobStore.isActive);
const batchError = computed(() => jobStore.errorMessage);

const rescueOptions = computed(() => {
  const assignedRescueIds = new Set(
    assignments.value
      .filter((assignment) => assignment.status === 'assigned')
      .map((assignment) => assignment.rescueId),
  );

  return props.rescues
    .filter(
      (rescue) =>
        !isTmsRescueReadOnly(rescue)
        && !rescue.oc_pdf?.trim()
        && !assignedRescueIds.has(rescue.id),
    )
    .map((rescue) => ({
      label: `${rescue.folio} · OC ${rescue.remittance_folio || '—'}`,
      value: rescue.id,
    }));
});

function rescueLabel(rescueId: number | null): string {
  if (rescueId == null) return '';
  const rescue = props.rescues.find((item) => item.id === rescueId);
  if (!rescue) return '';
  return `${rescue.folio} · OC ${rescue.remittance_folio || '—'}`;
}

const STATUS_TEXT_CLASS = {
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-error',
} as const;

const summary = computed(() => summarizeTmsAssignments(assignments.value));

const resultRows = computed(() =>
  assignments.value
    .map((assignment, index) => ({
      assignment,
      descriptor: describeTmsAssignment(assignment),
      index,
    }))
    .sort(
      (a, b) =>
        STATUS_WEIGHT[a.assignment.status] - STATUS_WEIGHT[b.assignment.status]
        || a.index - b.index,
    ),
);

const hasRetryableFiles = computed(
  () => summary.value.failed > 0 && state.files.length > 0 && !isJobActive.value,
);

const uploadLimitLabel = `${TMS_PURCHASE_ORDER_MAX_FILES} archivos · ${TMS_PURCHASE_ORDER_MAX_FILE_BYTES / (1024 * 1024)} MB c/u`;

function assignFile(assignment: TmsPurchaseOrderAssignment, rescueId: number) {
  if (!assignment.file.url) return;
  const rescue = props.rescues.find((item) => item.id === rescueId);
  const assignedInBatch = assignments.value.some(
    (item) =>
      item !== assignment
      && item.status === 'assigned'
      && item.rescueId === rescueId,
  );
  if (
    !rescue
    || isTmsRescueReadOnly(rescue)
    || Boolean(rescue.oc_pdf?.trim())
    || assignedInBatch
  ) {
    assignment.rescueId = rescue?.id ?? null;
    assignment.status = 'blocked';
    return;
  }
  assignment.rescueId = rescueId;
  assignment.status = 'assigned';
  emit('assign', { rescueId, url: assignment.file.url });
}

/** Devuelve la fila al modo manual para corregir un rescate mal relacionado. */
function reopenAssignment(assignment: TmsPurchaseOrderAssignment) {
  assignment.status = 'unmatched';
}

function syncAssignmentsFromJob(incoming: typeof jobStore.files) {
  const result = mergeTmsPurchaseOrderAssignments(
    assignments.value,
    incoming,
    props.rescues,
  );
  assignments.value = result.assignments;
  for (const assignment of result.newlyAssigned) {
    if (assignment.rescueId == null || !assignment.file.url) continue;
    const rescue = props.rescues.find((item) => item.id === assignment.rescueId);
    if (rescue && isTmsRescueReadOnly(rescue)) continue;
    emit('assign', {
      rescueId: assignment.rescueId,
      url: assignment.file.url,
    });
  }
}

watch(
  () => jobStore.files,
  (incoming) => {
    syncAssignmentsFromJob(incoming);
  },
  { deep: true, immediate: true },
);

watch(
  () => jobStore.status,
  (status) => {
    if (status !== 'done') return;
    state.files = retryableTmsUploadFiles(
      submittedFiles.value,
      assignments.value,
    );
  },
);

async function onSubmit(
  event: FormSubmitEvent<TmsPurchaseOrderUploadState>,
) {
  if (isSubmitting.value || isJobActive.value) return;

  const files = [...event.data.files];
  const resubmitted = new Set(files.map((file) => file.name));
  if (hasRetryableFiles.value) {
    assignments.value = assignments.value.filter(
      (assignment) =>
        assignment.status !== 'failed'
        && !resubmitted.has(assignment.file.fileName),
    );
  } else {
    assignments.value = [];
  }

  submittedFiles.value = files;
  try {
    await jobStore.startUpload(files);
  } catch {
    // El store ya notificó el error del POST (400 u otro).
  }
}

function resetModal() {
  state.files = [];
  if (!jobStore.hasJob && !assignments.value.length) {
    submittedFiles.value = [];
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Cargar órdenes de compra"
    :description="`Sube hasta ${TMS_PURCHASE_ORDER_MAX_FILES} PDFs. TMS los procesa en segundo plano y los relaciona por número de orden.`"
    :dismissible="!isSubmitting"
    :close="{ disabled: isSubmitting }"
    scrollable
    :ui="{ content: 'max-w-3xl' }"
    @after:leave="resetModal"
  >
    <UButton
      icon="i-lucide-files"
      :label="
        isJobActive
          ? `Carga ${jobStore.progressLabel}`
          : 'Cargar órdenes'
      "
    />

    <template #body>
      <UForm
        ref="formRef"
        :schema="tmsPurchaseOrderUploadSchema"
        :state="state"
        class="space-y-5"
        @submit="onSubmit"
      >
        <UFormField
          label="Archivos PDF"
          name="files"
          :description="`Solo PDF. Máximo ${uploadLimitLabel}. Se envían todos en una sola carga.`"
          required
        >
          <UFileUpload
            v-model="state.files"
            multiple
            accept=".pdf,application/pdf"
            variant="area"
            layout="list"
            position="inside"
            label="Arrastra tus órdenes de compra"
            :description="`PDF · máximo ${uploadLimitLabel}`"
            icon="i-lucide-file-up"
            :disabled="isSubmitting || isJobActive"
            class="w-full"
          />
        </UFormField>
      </UForm>

      <div
        v-if="jobStore.hasJob || isSubmitting"
        class="mt-5 space-y-2"
      >
        <div class="flex items-baseline justify-between gap-3">
          <p class="text-xs font-medium tracking-wide text-muted uppercase">
            Avance del trabajo
          </p>
          <p class="font-mono text-sm tabular-nums text-highlighted">
            {{ jobStore.progressLabel }}
          </p>
        </div>
        <UProgress
          :model-value="jobStore.completed"
          :max="jobStore.total || 1"
          :color="jobStore.expired ? 'error' : 'primary'"
          :get-value-label="() => jobStore.progressLabel"
        />
        <p
          v-if="isSubmitting"
          class="flex items-center gap-2 text-xs text-muted"
        >
          <UIcon
            name="i-lucide-loader-circle"
            class="size-3.5 animate-spin"
          />
          Enviando archivos…
        </p>
        <p
          v-else-if="isJobActive"
          class="text-xs text-muted"
        >
          El servicio sigue procesando. Puedes cerrar esta ventana; la tabla se
          irá llenando al reabrirla.
        </p>
        <p
          v-else-if="jobStore.expired"
          class="text-xs text-error"
        >
          El trabajo expiró. Vuelve a subir los archivos.
        </p>
      </div>

      <UAlert
        v-if="batchError"
        class="mt-4"
        color="error"
        variant="subtle"
        icon="i-lucide-triangle-alert"
        title="El servicio de PDFs reportó un problema"
        :description="batchError"
      />

      <div
        v-if="assignments.length"
        class="mt-6 space-y-3"
      >
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h3 class="text-sm font-semibold text-highlighted">
            Resultado ({{ summary.total }})
          </h3>
          <div class="flex flex-wrap items-center gap-1.5">
            <UBadge
              color="success"
              variant="subtle"
              :label="`${summary.assigned} asignadas`"
            />
            <UBadge
              color="warning"
              variant="subtle"
              :label="`${summary.pending} por asignar`"
            />
            <UBadge
              v-if="summary.blocked > 0"
              color="warning"
              variant="subtle"
              icon="i-lucide-lock"
              :label="`${summary.blocked} bloqueadas`"
            />
            <UBadge
              :color="summary.failed > 0 ? 'error' : 'neutral'"
              variant="subtle"
              :label="`${summary.failed} con error`"
            />
          </div>
        </div>

        <p
          v-if="hasRetryableFiles"
          class="text-xs text-muted"
        >
          Los archivos con error siguen seleccionados arriba: usa «Reintentar
          fallidos» para procesarlos de nuevo sin repetir los que ya subieron.
        </p>

        <ul class="divide-y divide-default rounded-lg border border-default">
          <li
            v-for="{ assignment, descriptor } in resultRows"
            :key="assignment.file.fileName"
            class="space-y-3 p-3"
          >
            <div class="flex items-start gap-3">
              <UIcon
                :name="descriptor.icon"
                class="mt-0.5 size-5 shrink-0"
                :class="STATUS_TEXT_CLASS[descriptor.color]"
              />
              <div class="min-w-0 flex-1 space-y-1">
                <p class="truncate text-sm font-medium text-highlighted">
                  {{ assignment.file.fileName }}
                </p>
                <p class="text-xs text-muted">
                  Folio:
                  {{ assignment.file.orderNumber || 'no identificado' }}
                </p>
                <p
                  class="text-xs"
                  :class="
                    descriptor.color === 'error' ? 'text-error' : 'text-toned'
                  "
                >
                  {{
                    assignment.file.error
                    || assignment.file.message
                    || descriptor.reason
                  }}
                </p>
              </div>
              <div class="flex shrink-0 items-center gap-1.5">
                <UButton
                  v-if="assignment.file.url"
                  :to="assignment.file.url"
                  target="_blank"
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  icon="i-lucide-external-link"
                  aria-label="Abrir PDF cargado"
                />
                <UBadge
                  :color="descriptor.color"
                  variant="subtle"
                  :label="descriptor.label"
                />
              </div>
            </div>

            <div
              v-if="
                assignment.status !== 'assigned'
                && assignment.status !== 'blocked'
                && assignment.file.url
              "
              class="flex flex-col gap-2 sm:flex-row"
            >
              <USelectMenu
                :model-value="assignment.rescueId ?? undefined"
                :items="rescueOptions"
                value-key="value"
                label-key="label"
                placeholder="Busca el rescate por folio u orden"
                :search-input="{ placeholder: 'Buscar folio u orden' }"
                icon="i-lucide-search"
                class="min-w-0 flex-1"
                @update:model-value="assignment.rescueId = $event ?? null"
              />
              <UButton
                label="Asignar"
                icon="i-lucide-link"
                :disabled="assignment.rescueId == null"
                @click="
                  assignment.rescueId != null
                    && assignFile(assignment, assignment.rescueId)
                "
              />
            </div>

            <div
              v-else-if="assignment.status === 'assigned' && assignment.file.url"
              class="flex flex-wrap items-center gap-2 text-xs text-muted"
            >
              <span class="truncate">
                Rescate {{ rescueLabel(assignment.rescueId) || 'relacionado' }}
              </span>
              <UButton
                color="neutral"
                variant="ghost"
                size="xs"
                icon="i-lucide-pencil"
                label="Cambiar"
                @click="reopenAssignment(assignment)"
              />
            </div>
            <p
              v-else-if="assignment.status === 'blocked'"
              class="text-xs text-warning"
            >
              Rescate {{ rescueLabel(assignment.rescueId) || 'identificado' }}:
              conserva la OC que ya tenía asignada.
            </p>
          </li>
        </ul>
      </div>
    </template>

    <template #footer="{ close }">
      <div class="flex w-full justify-end gap-2">
        <UButton
          color="neutral"
          variant="outline"
          label="Cerrar"
          :disabled="isSubmitting"
          @click="close"
        />
        <UButton
          :label="hasRetryableFiles ? 'Reintentar fallidos' : 'Procesar PDFs'"
          :icon="hasRetryableFiles ? 'i-lucide-refresh-cw' : 'i-lucide-scan-text'"
          :loading="isSubmitting"
          :disabled="isSubmitting || isJobActive || state.files.length === 0"
          @click="formRef?.submit()"
        />
      </div>
    </template>
  </UModal>
</template>
