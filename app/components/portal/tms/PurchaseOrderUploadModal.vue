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

const props = defineProps<{
  rescues: TmsRescue[];
}>();

const emit = defineEmits<{
  assign: [payload: { rescueId: number; url: string }];
}>();

const STATUS_WEIGHT: Record<TmsPurchaseOrderAssignment['status'], number> = {
  failed: 0,
  ambiguous: 1,
  unmatched: 2,
  assigned: 3,
};

const open = ref(false);
const formRef = useTemplateRef<Form<TmsPurchaseOrderUploadState>>('formRef');
const state = reactive<TmsPurchaseOrderUploadState>({ files: [] });
const assignments = ref<TmsPurchaseOrderAssignment[]>([]);
const batchError = ref<string | null>(null);
const isUploading = ref(false);
const processingCount = ref(0);
const toast = useToast();
const { uploadPurchaseOrders } = useTmsPurchaseOrderUpload();

const rescueOptions = computed(() =>
  props.rescues
    .filter((rescue) => !isTmsRescueReadOnly(rescue))
    .map((rescue) => ({
      label: `${rescue.folio} · OC ${rescue.remittance_folio || '—'}`,
      value: rescue.id,
    })),
);

function rescueLabel(rescueId: number | null): string {
  if (rescueId == null) return '';
  return (
    rescueOptions.value.find((option) => option.value === rescueId)?.label ?? ''
  );
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
  () => summary.value.failed > 0 && state.files.length > 0,
);

function assignFile(assignment: TmsPurchaseOrderAssignment, rescueId: number) {
  if (!assignment.file.url) return;
  const rescue = props.rescues.find((item) => item.id === rescueId);
  if (!rescue || isTmsRescueReadOnly(rescue)) return;
  assignment.rescueId = rescueId;
  assignment.status = 'assigned';
  emit('assign', { rescueId, url: assignment.file.url });
}

/** Devuelve la fila al modo manual para corregir un rescate mal relacionado. */
function reopenAssignment(assignment: TmsPurchaseOrderAssignment) {
  assignment.status = 'unmatched';
}

async function onSubmit(
  event: FormSubmitEvent<TmsPurchaseOrderUploadState>,
) {
  if (isUploading.value) return;

  const files = [...event.data.files];
  isUploading.value = true;
  processingCount.value = files.length;
  batchError.value = null;

  // Un reintento solo reemplaza los archivos reenviados; lo ya resuelto se queda.
  const resubmitted = new Set(files.map((file) => file.name));
  const kept = assignments.value.filter(
    (assignment) =>
      assignment.status !== 'failed' && !resubmitted.has(assignment.file.fileName),
  );

  try {
    const response = await uploadPurchaseOrders(files);

    const processed = assignTmsPurchaseOrders(response.files, props.rescues);
    assignments.value = [...kept, ...processed];
    batchError.value = response.batchError ?? null;

    for (const assignment of processed) {
      if (
        assignment.status === 'assigned'
        && assignment.rescueId != null
        && assignment.file.url
      ) {
        const rescue = props.rescues.find(
          (item) => item.id === assignment.rescueId,
        );
        if (rescue && isTmsRescueReadOnly(rescue)) continue;
        emit('assign', {
          rescueId: assignment.rescueId,
          url: assignment.file.url,
        });
      }
    }

    state.files = retryableTmsUploadFiles(files, assignments.value);
    toast.add({ ...formatTmsUploadFeedback(summary.value), duration: 8000 });
  } catch (error) {
    batchError.value = getFetchErrorMessage(error);
    toast.add({
      title: 'No se pudieron procesar las órdenes',
      description: batchError.value,
      color: 'error',
      duration: 8000,
    });
  } finally {
    isUploading.value = false;
    processingCount.value = 0;
  }
}

function resetModal() {
  if (isUploading.value) return;
  state.files = [];
  assignments.value = [];
  batchError.value = null;
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Cargar órdenes de compra"
    description="Sube hasta 20 PDFs. TMS intentará relacionarlos por número de orden de compra."
    :dismissible="!isUploading"
    :close="{ disabled: isUploading }"
    scrollable
    :ui="{ content: 'max-w-3xl' }"
    @after:leave="resetModal"
  >
    <UButton
      icon="i-lucide-files"
      label="Cargar órdenes"
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
          description="El servicio extraerá el número de orden y conservará el archivo original. Cada PDF se reporta por separado."
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
            description="PDF · máximo 20 archivos por lote"
            icon="i-lucide-file-up"
            :disabled="isUploading"
            class="w-full"
          />
        </UFormField>
      </UForm>

      <p
        v-if="isUploading"
        class="mt-4 flex items-center gap-2 text-sm text-muted"
      >
        <UIcon
          name="i-lucide-loader-circle"
          class="size-4 animate-spin"
        />
        Procesando {{ processingCount }}
        {{ processingCount === 1 ? 'archivo' : 'archivos' }}…
      </p>

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
            Resultado del lote ({{ summary.total }})
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
            v-for="{ assignment, descriptor, index } in resultRows"
            :key="`${assignment.file.fileName}-${index}`"
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
                  Orden de compra:
                  {{ assignment.file.orderNumber || 'no identificada' }}
                </p>
                <p
                  class="text-xs"
                  :class="
                    descriptor.color === 'error' ? 'text-error' : 'text-toned'
                  "
                >
                  {{ descriptor.reason }}
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
              v-if="assignment.status !== 'assigned' && assignment.file.url"
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
          :disabled="isUploading"
          @click="close"
        />
        <UButton
          :label="hasRetryableFiles ? 'Reintentar fallidos' : 'Procesar PDFs'"
          :icon="hasRetryableFiles ? 'i-lucide-refresh-cw' : 'i-lucide-scan-text'"
          :loading="isUploading"
          :disabled="isUploading || state.files.length === 0"
          @click="formRef?.submit()"
        />
      </div>
    </template>
  </UModal>
</template>
