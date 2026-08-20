<script setup lang="ts">
import type { Form, FormSubmitEvent } from '@nuxt/ui';
import type {
  TmsPurchaseOrderAssignment,
  TmsPurchaseOrderUploadResponse,
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

const open = ref(false);
const formRef = useTemplateRef<Form<TmsPurchaseOrderUploadState>>('formRef');
const state = reactive<TmsPurchaseOrderUploadState>({ files: [] });
const assignments = ref<TmsPurchaseOrderAssignment[]>([]);
const isUploading = ref(false);
const toast = useToast();
const apiFetch = useApiFetch();

const rescueOptions = computed(() =>
  props.rescues.map((rescue) => ({
    label: `${rescue.folio} · OC ${rescue.remittance_folio || '—'}`,
    value: rescue.id,
  })),
);

const assignedCount = computed(
  () => assignments.value.filter((item) => item.status === 'assigned').length,
);

function assignFile(assignment: TmsPurchaseOrderAssignment, rescueId: number) {
  if (!assignment.file.url) return;
  assignment.rescueId = rescueId;
  assignment.status = 'assigned';
  emit('assign', { rescueId, url: assignment.file.url });
}

async function onSubmit(
  event: FormSubmitEvent<TmsPurchaseOrderUploadState>,
) {
  if (isUploading.value) return;
  isUploading.value = true;
  assignments.value = [];

  const body = new FormData();
  for (const file of event.data.files) body.append('files', file);

  try {
    const response = await apiFetch<TmsPurchaseOrderUploadResponse>(
      '/api/portals/tms/purchase-orders/upload',
      {
        method: 'POST',
        body,
      },
    );
    assignments.value = assignTmsPurchaseOrders(response.files, props.rescues);

    for (const assignment of assignments.value) {
      if (
        assignment.status === 'assigned'
        && assignment.rescueId != null
        && assignment.file.url
      ) {
        emit('assign', {
          rescueId: assignment.rescueId,
          url: assignment.file.url,
        });
      }
    }

    state.files = [];
    toast.add({
      title: 'Órdenes procesadas',
      description: `${assignedCount.value} de ${response.files.length} asignadas automáticamente`,
      color: assignedCount.value > 0 ? 'success' : 'warning',
    });
  } catch (error) {
    toast.add({
      title: 'No se pudieron procesar las órdenes',
      description: getFetchErrorMessage(error),
      color: 'error',
    });
  } finally {
    isUploading.value = false;
  }
}

function resetModal() {
  if (isUploading.value) return;
  state.files = [];
  assignments.value = [];
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
          description="El servicio extraerá el número de orden y conservará el archivo original."
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

      <div
        v-if="assignments.length"
        class="mt-6 space-y-3"
      >
        <div class="flex items-center justify-between gap-3">
          <h3 class="text-sm font-semibold text-highlighted">
            Resultado del lote
          </h3>
          <UBadge
            color="neutral"
            variant="subtle"
            :label="`${assignedCount}/${assignments.length} asignadas`"
          />
        </div>

        <ul class="divide-y divide-default rounded-lg border border-default">
          <li
            v-for="(assignment, index) in assignments"
            :key="`${assignment.file.fileName}-${index}`"
            class="space-y-3 p-3"
          >
            <div class="flex items-start gap-3">
              <UIcon
                :name="
                  assignment.status === 'assigned'
                    ? 'i-lucide-circle-check'
                    : assignment.status === 'failed'
                      ? 'i-lucide-circle-x'
                      : 'i-lucide-circle-help'
                "
                class="mt-0.5 size-5 shrink-0"
                :class="
                  assignment.status === 'assigned'
                    ? 'text-success'
                    : assignment.status === 'failed'
                      ? 'text-error'
                      : 'text-warning'
                "
              />
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium text-highlighted">
                  {{ assignment.file.fileName }}
                </p>
                <p class="text-xs text-muted">
                  Orden: {{ assignment.file.orderNumber || 'No identificada' }}
                </p>
                <p
                  v-if="assignment.file.error || assignment.file.message"
                  class="mt-1 text-xs"
                  :class="assignment.file.error ? 'text-error' : 'text-muted'"
                >
                  {{ assignment.file.error || assignment.file.message }}
                </p>
              </div>
              <UBadge
                v-if="assignment.status === 'assigned'"
                color="success"
                variant="subtle"
                label="Asignada"
              />
            </div>

            <div
              v-if="assignment.status !== 'assigned' && assignment.file.url"
              class="flex flex-col gap-2 sm:flex-row"
            >
              <USelect
                :model-value="assignment.rescueId ?? undefined"
                :items="rescueOptions"
                value-key="value"
                label-key="label"
                placeholder="Selecciona el rescate"
                class="min-w-0 flex-1"
                @update:model-value="assignment.rescueId = $event ?? null"
              />
              <UButton
                color="neutral"
                variant="subtle"
                label="Asignar"
                icon="i-lucide-link"
                :disabled="assignment.rescueId == null"
                @click="
                  assignment.rescueId != null
                    && assignFile(assignment, assignment.rescueId)
                "
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
          label="Procesar PDFs"
          icon="i-lucide-scan-text"
          :loading="isUploading"
          :disabled="isUploading"
          @click="formRef?.submit()"
        />
      </div>
    </template>
  </UModal>
</template>
