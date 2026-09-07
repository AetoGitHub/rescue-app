<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui';
import {
  RESCUE_EVIDENCE_MODAL_COPY,
  RESCUE_FIREBASE_UPLOAD_WEBHOOK_DEFAULT,
} from '~/constants/rescue-evidence-api';
import {
  parseRescueAdminDocInput,
  rescueAdminDocCopySchema,
  rescueAdminDocToBody,
  type RescueAdminDocFormOutput,
  type RescueAdminDocFormState,
} from '~/schemas/rescue-admin-doc';

const open = defineModel<boolean>('open', { required: true });

const props = withDefaults(
  defineProps<{
    sourceRescueId: number;
    clientId?: number;
    remittanceFolio: string;
    invoiceFolio: string;
    ocPdf?: string;
    loading?: boolean;
    /** When false, only this rescue is sent (Por Facturar). */
    allowExtraRescues?: boolean;
    /** When true, remisión and factura are editable inputs. */
    editableFolios?: boolean;
  }>(),
  {
    clientId: 0,
    ocPdf: '',
    loading: false,
    allowExtraRescues: true,
    editableFolios: false,
  },
);

const emit = defineEmits<{
  submit: [body: ReturnType<typeof rescueAdminDocToBody>];
}>();

type SendStep = 'question' | 'select';

const step = ref<SendStep>('question');
const formRef = ref<{ submit: () => Promise<void> } | null>(null);
const toast = useToast();
const { onFormError } = useFormValidationFeedback();
const ocPdfCopy = RESCUE_EVIDENCE_MODAL_COPY.admin_oc_pdf;

const runtimeConfig = useRuntimeConfig();
const webhookUrl = computed(
  () =>
    runtimeConfig.public.firebaseUploadWebhookUrl
    || RESCUE_FIREBASE_UPLOAD_WEBHOOK_DEFAULT,
);

const parsedFolios = computed(() => {
  const parsed = parseRescueAdminDocInput({
    remittance_folio: props.remittanceFolio,
    invoice_folio: props.invoiceFolio,
  });
  return parsed.success ? parsed.data : null;
});

const state = reactive<RescueAdminDocFormState>({
  remittance_folio: '',
  invoice_folio: '',
  extra_rescues: [],
  oc_pdf: '',
});

const pendingFile = ref<File | null>(null);
const uploadedForFile = ref<File | null>(null);
const isUploading = ref(false);
const uploadProgress = ref<number | null>(null);
const uploadLabel = ref('');
const acceptAttribute = administrativeOcPdfAcceptAttribute();

const isBusy = computed(() => isUploading.value || Boolean(props.loading));
const hasUploadedPdf = computed(() => Boolean(state.oc_pdf.trim()));

const uploadDescription = computed(() => {
  if (isUploading.value && uploadLabel.value) return uploadLabel.value;
  if (isUploading.value) return RESCUE_EVIDENCE_MODAL_COPY.uploading;
  if (hasUploadedPdf.value) return ocPdfCopy.uploadSuccessHint;
  return ocPdfCopy.dropzoneDescription;
});

const {
  guardedOpen,
  discardConfirmOpen,
  requestClose,
  confirmDiscard,
  cancelDiscard,
  resetDirtySnapshot,
} = useDiscardChangesGuard({
  open,
  snapshot: () => ({
    step: step.value,
    state,
    pendingFileName: pendingFile.value?.name ?? '',
    pendingFileSize: pendingFile.value?.size ?? 0,
  }),
});

function resetUploadState() {
  pendingFile.value = null;
  uploadedForFile.value = null;
  state.oc_pdf = '';
  uploadProgress.value = null;
  uploadLabel.value = '';
}

watch(open, (isOpen) => {
  if (isOpen) {
    step.value = 'question';
    state.remittance_folio = props.remittanceFolio;
    state.invoice_folio = props.invoiceFolio;
    state.extra_rescues = [];
    resetUploadState();
    state.oc_pdf = props.ocPdf.trim();
    resetDirtySnapshot();
    return;
  }

  if (isUploading.value) {
    open.value = true;
    toast.add({
      title: RESCUE_EVIDENCE_MODAL_COPY.uploadInProgressCloseBlocked,
      color: 'warning',
    });
    return;
  }

  resetUploadState();
}, { immediate: true });

function fileFromUploadValue(
  value: File | File[] | null | undefined,
): File | undefined {
  if (value == null) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

function onPendingFilesChange(value: File | File[] | null | undefined) {
  const file = fileFromUploadValue(value);
  if (!file) {
    if (!isUploading.value) {
      resetUploadState();
    }
    return;
  }

  if (!isAdministrativeOcPdfFileAllowed(file)) {
    toast.add({
      title: ocPdfCopy.invalidFile,
      color: 'error',
    });
    pendingFile.value = null;
    uploadedForFile.value = null;
    state.oc_pdf = '';
    return;
  }

  pendingFile.value = file;
  if (uploadedForFile.value !== file) {
    uploadedForFile.value = null;
    state.oc_pdf = '';
  }
}

const { isDragging: isFullscreenDragging } = useFullscreenFileDrop({
  model: pendingFile,
  accept: acceptAttribute,
  disabled: isBusy,
  enabled: open,
  onFiles: (value) => {
    onPendingFilesChange(value);
  },
});

async function uploadPendingIfNeeded(): Promise<boolean> {
  const file = pendingFile.value;
  if (!file) {
    return true;
  }

  if (
    uploadedForFile.value === file
    && state.oc_pdf.trim().length > 0
  ) {
    return true;
  }

  if (!isAdministrativeOcPdfFileAllowed(file)) {
    toast.add({
      title: ocPdfCopy.invalidFile,
      color: 'error',
    });
    return false;
  }

  isUploading.value = true;
  uploadProgress.value = 0;
  uploadLabel.value = RESCUE_EVIDENCE_MODAL_COPY.uploadingFile(file.name, 1, 1);

  try {
    const url = await uploadFileToFirebaseGeneral(
      file,
      buildAdministrativeOcPdfStoragePath(props.sourceRescueId),
      webhookUrl.value,
      {
        onProgress: (percent) => {
          uploadProgress.value = percent;
        },
      },
    );
    state.oc_pdf = url;
    uploadedForFile.value = file;
    uploadProgress.value = 100;
    return true;
  } catch (error) {
    toast.add({
      title: RESCUE_EVIDENCE_MODAL_COPY.uploadError,
      description: getFetchErrorMessage(error),
      color: 'error',
    });
    uploadedForFile.value = null;
    state.oc_pdf = '';
    return false;
  } finally {
    isUploading.value = false;
    uploadProgress.value = null;
    uploadLabel.value = '';
  }
}

async function prepareAndSubmit() {
  if (isBusy.value) return;
  const uploaded = await uploadPendingIfNeeded();
  if (!uploaded) return;
  await formRef.value?.submit();
}

function onOnlyThisRescue() {
  state.extra_rescues = [];
  void prepareAndSubmit();
}

function onSelectOthers() {
  if (!props.allowExtraRescues) return;
  step.value = 'select';
}

function onBack() {
  step.value = 'question';
  state.extra_rescues = [];
}

function onSubmit(event: FormSubmitEvent<RescueAdminDocFormOutput>) {
  if (isBusy.value) return;
  emit('submit', rescueAdminDocToBody(event.data));
}

function onApplySelected() {
  void prepareAndSubmit();
}
</script>

<template>
  <UModal
    v-model:open="guardedOpen"
    :dismissible="false"
    title="Enviar documentos"
    :ui="{ content: 'max-w-lg' }"
  >
    <template #body>
      <UForm
        ref="formRef"
        :schema="rescueAdminDocCopySchema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
        @error="onFormError"
      >
        <div
          v-if="!editableFolios"
          class="rounded-lg border border-default bg-muted/20 px-3 py-2 text-sm"
        >
          <p class="text-xs font-medium uppercase text-muted">
            Folios a enviar
          </p>
          <p
            v-if="parsedFolios?.remittance_folio"
            class="mt-1 text-highlighted"
          >
            <span class="text-muted">Remisión (OC):</span>
            {{ parsedFolios.remittance_folio }}
          </p>
          <p
            v-if="parsedFolios?.invoice_folio"
            class="text-highlighted"
          >
            <span class="text-muted">Factura:</span>
            {{ parsedFolios.invoice_folio }}
          </p>
        </div>

        <template v-else>
          <UFormField
            label="Remisión (OC)"
            name="remittance_folio"
          >
            <UInput
              v-model="state.remittance_folio"
              class="w-full"
              placeholder="Remisión (OC)"
              :disabled="isBusy"
            />
          </UFormField>

          <UFormField
            label="Factura"
            name="invoice_folio"
          >
            <UInput
              v-model="state.invoice_folio"
              class="w-full"
              placeholder="Factura"
              :disabled="isBusy"
            />
          </UFormField>
        </template>

        <UFormField
          label="PDF de orden de compra"
          name="oc_pdf"
          hint="Opcional"
        >
          <UFileUpload
            v-model="pendingFile"
            variant="area"
            size="sm"
            layout="list"
            :dropzone="true"
            :preview="true"
            :accept="acceptAttribute"
            :disabled="isBusy"
            :description="uploadDescription"
            :class="isUploading ? 'pointer-events-none opacity-80' : ''"
            :icon="
              hasUploadedPdf && !isUploading
                ? 'i-lucide-circle-check'
                : 'i-lucide-upload'
            "
            :label="
              hasUploadedPdf && !isUploading
                ? ocPdfCopy.changeLabel
                : ocPdfCopy.label
            "
            class="w-full"
            :ui="{ base: 'min-h-28' }"
            @update:model-value="onPendingFilesChange"
          />
        </UFormField>

        <div
          v-if="isUploading"
          class="space-y-2"
        >
          <UProgress
            :model-value="uploadProgress"
            status
            size="md"
            color="primary"
          />
          <p class="text-center text-sm text-muted">
            {{ uploadLabel || RESCUE_EVIDENCE_MODAL_COPY.uploading }}
          </p>
        </div>

        <template v-if="allowExtraRescues && step === 'question'">
          <p class="text-sm text-highlighted">
            ¿Deseas aplicar los mismos folios a otros rescates?
          </p>
        </template>

        <template v-else-if="allowExtraRescues">
          <UFormField
            label="Otros rescates"
            name="extra_rescues"
            hint="Busca por folio y selecciona uno o más rescates"
          >
            <AdministrativeRescueDropdownMultiSelect
              v-model="state.extra_rescues"
              :exclude-rescue-id="sourceRescueId"
              :client-id="clientId"
              :disabled="isBusy"
            />
          </UFormField>
        </template>

        <UFormField
          v-if="!editableFolios"
          name="remittance_folio"
          class="hidden"
        />
        <UFormField
          v-if="!editableFolios"
          name="invoice_folio"
          class="hidden"
        />
      </UForm>
    </template>

    <template #footer>
      <div class="flex w-full flex-wrap justify-end gap-2">
        <template v-if="step === 'question' || !allowExtraRescues">
          <UButton
            color="neutral"
            label="Cancelar"
            variant="subtle"
            :disabled="isBusy"
            @click="requestClose"
          />
          <UButton
            v-if="allowExtraRescues"
            color="neutral"
            label="Sí, seleccionar otros"
            variant="outline"
            :disabled="isBusy"
            @click="onSelectOthers"
          />
          <UButton
            color="primary"
            :label="allowExtraRescues ? 'No, solo este rescate' : 'Enviar'"
            :loading="isBusy"
            :disabled="isBusy"
            @click="onOnlyThisRescue"
          />
        </template>

        <template v-else>
          <UButton
            color="neutral"
            label="Atrás"
            variant="subtle"
            :disabled="isBusy"
            @click="onBack"
          />
          <UButton
            color="primary"
            label="Enviar"
            :loading="isBusy"
            :disabled="isBusy"
            @click="onApplySelected"
          />
        </template>
      </div>
    </template>
  </UModal>

  <SharedDiscardChangesConfirmModal
    v-model:open="discardConfirmOpen"
    @confirm="confirmDiscard"
    @cancel="cancelDiscard"
  />

  <SharedFullscreenFileDropOverlay :active="isFullscreenDragging" />
</template>
