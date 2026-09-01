<script setup lang="ts">
import type { PendingInvoiceRow } from '~/interfaces/invoicing/pending-invoice';
import { PENDING_INVOICE_ADMIN_DOC_COPY } from '~/constants/pending-invoice';
import {
  RESCUE_EVIDENCE_MODAL_COPY,
  RESCUE_FIREBASE_UPLOAD_WEBHOOK_DEFAULT,
} from '~/constants/rescue-evidence-api';
import {
  parsePendingInvoiceAdminDoc,
  pendingInvoiceAdminDocToBody,
} from '~/schemas/pending-invoice';

const props = defineProps<{
  row: PendingInvoiceRow;
}>();

const { save, isSaving } = useRescueAdminDoc(() => props.row.id);
const toast = useToast();
const runtimeConfig = useRuntimeConfig();
const webhookUrl = computed(
  () =>
    runtimeConfig.public.firebaseUploadWebhookUrl
    || RESCUE_FIREBASE_UPLOAD_WEBHOOK_DEFAULT,
);

const pendingFile = ref<File | null>(null);
const isUploading = ref(false);
const acceptAttribute = administrativeOcPdfAcceptAttribute();
const isBusy = computed(() => isUploading.value || isSaving.value);
const hasPdf = computed(() => Boolean(props.row.oc_pdf?.trim()));

function fileFromUploadValue(
  value: File | File[] | null | undefined,
): File | undefined {
  if (value == null) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

async function onFileChange(value: File | File[] | null | undefined) {
  const file = fileFromUploadValue(value);
  pendingFile.value = null;
  if (!file || isBusy.value) return;

  if (!isAdministrativeOcPdfFileAllowed(file)) {
    toast.add({
      title: RESCUE_EVIDENCE_MODAL_COPY.admin_oc_pdf.invalidFile,
      color: 'error',
    });
    return;
  }

  isUploading.value = true;
  try {
    const url = await uploadFileToFirebaseGeneral(
      file,
      buildAdministrativeOcPdfStoragePath(props.row.id),
      webhookUrl.value,
    );
    const parsed = parsePendingInvoiceAdminDoc({
      invoice_folio: props.row.factura,
      oc_pdf: url,
    });
    if (!parsed.success) {
      toast.add({
        title: parsed.error.issues[0]?.message ?? PENDING_INVOICE_ADMIN_DOC_COPY.ocPdfError,
        color: 'error',
      });
      return;
    }

    const ok = await save(pendingInvoiceAdminDocToBody(parsed.data), {
      silent: true,
    });
    if (ok) {
      toast.add({
        title: PENDING_INVOICE_ADMIN_DOC_COPY.ocPdfSuccess,
        color: 'success',
      });
    }
  } catch (error) {
    toast.add({
      title: PENDING_INVOICE_ADMIN_DOC_COPY.ocPdfError,
      description: getFetchErrorMessage(error),
      color: 'error',
    });
  } finally {
    isUploading.value = false;
  }
}
</script>

<template>
  <div class="flex items-center justify-center gap-0.5">
    <UButton
      v-if="hasPdf"
      :to="row.oc_pdf!"
      target="_blank"
      color="neutral"
      variant="ghost"
      size="xs"
      square
      icon="i-lucide-file-text"
      :aria-label="PENDING_INVOICE_ADMIN_DOC_COPY.ocPdfOpen"
    />

    <UFileUpload
      v-model="pendingFile"
      variant="button"
      size="xs"
      color="neutral"
      :accept="acceptAttribute"
      reset
      :preview="false"
      :dropzone="false"
      :disabled="isBusy"
      :icon="isUploading ? 'i-lucide-loader-circle' : 'i-lucide-upload'"
      label=""
      :aria-label="hasPdf
        ? PENDING_INVOICE_ADMIN_DOC_COPY.ocPdfReplace
        : PENDING_INVOICE_ADMIN_DOC_COPY.ocPdfUpload"
      :ui="{
        base: 'min-h-0 px-1.5 py-1 ring-0 shadow-none',
        label: 'hidden',
        leadingIcon: isUploading ? 'animate-spin' : undefined,
      }"
      @update:model-value="onFileChange"
    />
  </div>
</template>
