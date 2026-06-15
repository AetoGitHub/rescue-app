<script setup lang="ts">
import {
  RESCUE_EVIDENCE_MODAL_COPY,
  RESCUE_EVIDENCE_TYPE_PAYMENT_PROVIDER,
  RESCUE_FIREBASE_UPLOAD_WEBHOOK_DEFAULT,
} from '~/constants/rescue-evidence-api';
import type { RescueAdministrativePaymentFormState } from '~/interfaces/rescue/administrative';

const open = defineModel<boolean>('open', { required: true });

const props = defineProps<{
  rescueId: number;
  loading?: boolean;
}>();

const emit = defineEmits<{
  submit: [];
}>();

const form = defineModel<RescueAdministrativePaymentFormState>('form', {
  required: true,
});

const adminCopy = RESCUE_EVIDENCE_MODAL_COPY.admin_payment;

const runtimeConfig = useRuntimeConfig();
const webhookUrl = computed(
  () =>
    runtimeConfig.public.firebaseUploadWebhookUrl ||
    RESCUE_FIREBASE_UPLOAD_WEBHOOK_DEFAULT,
);

const toast = useToast();
const pendingFile = ref<File | null>(null);
const isUploading = ref(false);
/** URL de Firebase; no se muestra en pantalla, solo se envía al aplicar pago. */
const uploadedEvidenceUrl = ref('');

const acceptAttribute = computed(() =>
  rescueEvidenceAcceptAttribute(RESCUE_EVIDENCE_TYPE_PAYMENT_PROVIDER),
);

const isBusy = computed(() => isUploading.value || props.loading);

const hasUploadedEvidence = computed(() =>
  Boolean(uploadedEvidenceUrl.value.trim()),
);

const uploadDescription = computed(() => {
  if (isUploading.value) return RESCUE_EVIDENCE_MODAL_COPY.uploading;
  if (hasUploadedEvidence.value) return adminCopy.uploadSuccessHint;
  return adminCopy.dropzoneDescription;
});

function fileFromUploadValue(
  value: File | File[] | null | undefined,
): File | undefined {
  if (value == null) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

async function uploadFile(file: File) {
  if (!isAdministrativePaymentFileAllowed(file)) {
    toast.add({
      title: adminCopy.invalidFile,
      color: 'error',
    });
    return;
  }

  isUploading.value = true;
  uploadedEvidenceUrl.value = '';
  form.value.payment_evidence_url = '';

  try {
    const storagePath = buildAdministrativePaymentStoragePath(props.rescueId);
    const url = await uploadFileToFirebaseGeneral(
      file,
      storagePath,
      webhookUrl.value,
    );
    uploadedEvidenceUrl.value = url;
    pendingFile.value = file;
  } catch (error) {
    toast.add({
      title: RESCUE_EVIDENCE_MODAL_COPY.uploadError,
      description: getFetchErrorMessage(error),
      color: 'error',
    });
    pendingFile.value = null;
  } finally {
    isUploading.value = false;
  }
}

async function onPendingFilesChange(value: File | File[] | null | undefined) {
  const file = fileFromUploadValue(value);
  if (!file) {
    if (!isUploading.value) {
      uploadedEvidenceUrl.value = '';
      form.value.payment_evidence_url = '';
    }
    return;
  }
  if (isUploading.value || props.loading) return;

  await uploadFile(file);
}

function onApplyPayment() {
  if (!hasUploadedEvidence.value || isBusy.value) return;
  form.value.payment_evidence_url = uploadedEvidenceUrl.value;
  emit('submit');
}

function resetUploadState() {
  uploadedEvidenceUrl.value = '';
  form.value.payment_evidence_url = '';
  pendingFile.value = null;
}

watch(open, (isOpen) => {
  if (!isOpen) {
    resetUploadState();
  }
});
</script>

<template>
  <UModal
    v-model:open="open"
    :dismissible="false"
    title="Aplicar pago"
    :ui="{ content: 'max-w-md' }"
  >
    <template #body>
      <div class="space-y-4">
        <UAlert
          v-if="hasUploadedEvidence && !isUploading"
          color="success"
          icon="i-lucide-circle-check"
          :title="adminCopy.uploadSuccess"
          :description="adminCopy.uploadSuccessHint"
          variant="subtle"
        />

        <UFileUpload
          v-model="pendingFile"
          variant="area"
          size="lg"
          layout="list"
          :dropzone="true"
          :preview="true"
          :accept="acceptAttribute"
          :disabled="isBusy"
          :description="uploadDescription"
          :icon="
            hasUploadedEvidence && !isUploading
              ? 'i-lucide-circle-check'
              : 'i-lucide-upload'
          "
          :label="
            hasUploadedEvidence && !isUploading
              ? 'Cambiar comprobante'
              : 'Subir comprobante'
          "
          class="w-full"
          :ui="{ base: 'min-h-40' }"
          @update:model-value="onPendingFilesChange"
        />

        <UButton
          block
          color="primary"
          label="Aplicar pago"
          :disabled="isBusy || !hasUploadedEvidence"
          :loading="loading || isUploading"
          @click="onApplyPayment"
        />
      </div>
    </template>
  </UModal>
</template>
