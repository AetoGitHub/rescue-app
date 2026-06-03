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

const copy = RESCUE_EVIDENCE_MODAL_COPY[RESCUE_EVIDENCE_TYPE_PAYMENT_PROVIDER];

const runtimeConfig = useRuntimeConfig();
const webhookUrl = computed(
  () =>
    runtimeConfig.public.firebaseUploadWebhookUrl ||
    RESCUE_FIREBASE_UPLOAD_WEBHOOK_DEFAULT,
);

const toast = useToast();
const pendingFiles = ref<File[]>([]);
const isUploading = ref(false);

const acceptAttribute = computed(() =>
  rescueEvidenceAcceptAttribute(RESCUE_EVIDENCE_TYPE_PAYMENT_PROVIDER),
);

const isBusy = computed(() => isUploading.value || props.loading);

async function uploadFile(file: File) {
  if (
    !isRescueEvidenceFileAllowed(file, RESCUE_EVIDENCE_TYPE_PAYMENT_PROVIDER)
  ) {
    toast.add({
      title: copy.invalidFile,
      color: 'error',
    });
    return;
  }

  isUploading.value = true;
  try {
    const storagePath = buildRescueEvidenceStoragePath(
      props.rescueId,
      RESCUE_EVIDENCE_TYPE_PAYMENT_PROVIDER,
    );
    const url = await uploadFileToFirebaseGeneral(
      file,
      storagePath,
      webhookUrl.value,
    );
    form.value.payment_evidence_url = url;
    toast.add({
      title: copy.uploadSuccess,
      color: 'success',
    });
  } catch (error) {
    toast.add({
      title: RESCUE_EVIDENCE_MODAL_COPY.uploadError,
      description: getFetchErrorMessage(error),
      color: 'error',
    });
  } finally {
    isUploading.value = false;
  }
}

async function onPendingFilesChange(value: File[] | null | undefined) {
  const files = value?.length ? [...value] : [];
  const file = files[0];
  if (!file || isBusy.value) return;

  await uploadFile(file);
  pendingFiles.value = [];
}

watch(open, (isOpen) => {
  if (!isOpen) {
    pendingFiles.value = [];
  }
});
</script>

<template>
  <UModal
    v-model:open="open"
    title="Aplicar pago"
    :ui="{ content: 'max-w-md' }"
  >
    <template #body>
      <div class="space-y-4">
        <UFormField
          label="Comprobante de pago"
          name="payment_evidence"
          required
        >
          <UFileUpload
            v-model="pendingFiles"
            :accept="acceptAttribute"
            :disabled="isBusy"
            :description="
              isUploading
                ? RESCUE_EVIDENCE_MODAL_COPY.uploading
                : 'PDF o imagen del comprobante'
            "
            icon="i-lucide-upload"
            label="Subir comprobante"
            @update:model-value="onPendingFilesChange"
          />
        </UFormField>

        <UFormField
          label="URL del comprobante"
          name="payment_evidence_url"
          required
          hint="O pega la URL si ya está alojada"
        >
          <UInput
            v-model="form.payment_evidence_url"
            class="w-full"
            type="url"
            placeholder="https://..."
            :disabled="isBusy"
          />
        </UFormField>

        <UButton
          block
          color="primary"
          label="Aplicar pago"
          :disabled="isBusy || !form.payment_evidence_url.trim()"
          :loading="loading || isUploading"
          @click="emit('submit')"
        />
      </div>
    </template>
  </UModal>
</template>
