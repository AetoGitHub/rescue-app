<script setup lang="ts">
import { useQueryCache } from '@pinia/colada';
import {
  CONTRACT_IMPORT_PRICES_LABELS,
  CONTRACT_IMPORT_PRICES_TEMPLATE_PATH,
  CONTRACT_IMPORT_PRICES_UPLOAD_PATH,
} from '~/constants/contract-import-prices-api';

interface ContractImportPricesUploadResponse {
  created: number[];
  skipped: Array<{ row: number; detail: unknown }>;
}

const open = defineModel<boolean>('open', { required: true });

const props = defineProps<{
  contractId: number;
}>();

const toast = useToast();
const queryCache = useQueryCache();

const selectedFile = ref<File | null>(null);
const isDownloadingFormat = ref(false);
const isUploading = ref(false);

function stringifySkippedDetail(detail: unknown): string {
  if (typeof detail === 'string') return detail;
  if (detail && typeof detail === 'object') {
    return Object.entries(detail as Record<string, unknown>)
      .map(([field, messages]) =>
        Array.isArray(messages) ? `${field}: ${messages.join(', ')}` : `${field}: ${messages}`,
      )
      .join(' · ');
  }
  return 'Motivo desconocido';
}

async function handleDownloadFormat() {
  isDownloadingFormat.value = true;
  try {
    const response = await $fetch.raw<Blob>(
      CONTRACT_IMPORT_PRICES_TEMPLATE_PATH(props.contractId),
      { responseType: 'blob' },
    );
    const filename =
      filenameFromContentDisposition(response.headers.get('content-disposition'))
      || `contrato_${props.contractId}_items.xlsx`;
    downloadBlob(response._data as Blob, filename);
  } catch (error) {
    toast.add({
      title: CONTRACT_IMPORT_PRICES_LABELS.downloadErrorTitle,
      description: getFetchErrorMessage(error),
      color: 'error',
    });
  } finally {
    isDownloadingFormat.value = false;
  }
}

async function handleUpload() {
  const file = selectedFile.value;
  if (!file) {
    toast.add({
      title: CONTRACT_IMPORT_PRICES_LABELS.noFileTitle,
      color: 'warning',
    });
    return;
  }

  isUploading.value = true;
  try {
    const form = new FormData();
    form.append('file', file);

    const response = await $fetch<ContractImportPricesUploadResponse>(
      CONTRACT_IMPORT_PRICES_UPLOAD_PATH(props.contractId),
      { method: 'POST', body: form },
    );

    await queryCache.invalidateQueries({
      key: ['contract-items', props.contractId],
    });

    if (response.created.length > 0) {
      toast.add({
        title: CONTRACT_IMPORT_PRICES_LABELS.uploadSuccessTitle,
        description: `${response.created.length} precio(s) agregado(s).`,
        color: 'success',
      });
    }

    if (response.skipped.length > 0) {
      toast.add({
        title: CONTRACT_IMPORT_PRICES_LABELS.skippedRowTitle(response.skipped.length),
        description: response.skipped
          .map((s) => `Fila ${s.row}: ${stringifySkippedDetail(s.detail)}`)
          .join(' · '),
        color: 'warning',
      });
    }

    selectedFile.value = null;
    if (response.skipped.length === 0) open.value = false;
  } catch (error) {
    toast.add({
      title: CONTRACT_IMPORT_PRICES_LABELS.uploadErrorTitle,
      description: getFetchErrorMessage(error),
      color: 'error',
    });
  } finally {
    isUploading.value = false;
  }
}

function handleCancel() {
  open.value = false;
}

watch(open, (isOpen) => {
  if (!isOpen) selectedFile.value = null;
});
</script>

<template>
  <UModal
    v-model:open="open"
    :dismissible="false"
    :close="false"
    :title="CONTRACT_IMPORT_PRICES_LABELS.modalTitle"
    :description="CONTRACT_IMPORT_PRICES_LABELS.modalDescription"
    :ui="{ content: 'max-w-lg' }"
  >
    <template #body>
      <UFileUpload
        v-model="selectedFile"
        variant="area"
        size="lg"
        icon="i-lucide-file-spreadsheet"
        accept=".xlsx"
        :dropzone="true"
        :disabled="isUploading"
        :label="CONTRACT_IMPORT_PRICES_LABELS.dropzoneLabel"
        :description="CONTRACT_IMPORT_PRICES_LABELS.dropzoneDescription"
        class="w-full"
        :ui="{ base: 'min-h-48' }"
      />
    </template>

    <template #footer>
      <div class="flex w-full flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-3">
          <UButton
            color="neutral"
            variant="outline"
            :label="CONTRACT_IMPORT_PRICES_LABELS.cancelButton"
            :disabled="isDownloadingFormat || isUploading"
            @click="handleCancel"
          />
          <UButton
            color="neutral"
            variant="subtle"
            icon="i-lucide-download"
            :label="CONTRACT_IMPORT_PRICES_LABELS.downloadFormatButton"
            :loading="isDownloadingFormat"
            :disabled="isDownloadingFormat || isUploading"
            @click="handleDownloadFormat"
          />
        </div>
        <UButton
          color="primary"
          icon="i-lucide-upload"
          :label="CONTRACT_IMPORT_PRICES_LABELS.uploadButton"
          :loading="isUploading"
          :disabled="!selectedFile || isUploading"
          @click="handleUpload"
        />
      </div>
    </template>
  </UModal>
</template>
