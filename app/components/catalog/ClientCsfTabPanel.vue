<script setup lang="ts">
import { clientCsfAcceptAttribute } from '~/utils/client-csf-upload';

const props = defineProps<{
  clientId: number;
  csfUrl?: string | null;
}>();

const emit = defineEmits<{
  saved: [url: string];
}>();

const csfUrlModel = defineModel<string | null>('csfUrl', { default: null });

const displayUrl = computed(() => csfUrlModel.value ?? props.csfUrl ?? null);

const {
  uploadFile,
  savePendingCsf,
  resetPendingUpload,
  pendingUrl,
  isUploading,
  isSaving,
  hasPendingUpload,
} = useClientCsf({
  clientId: computed(() => props.clientId),
});

const pendingFile = ref<File | null>(null);

const acceptAttribute = clientCsfAcceptAttribute();

const uploadDescription = computed(() => {
  if (isUploading.value) return 'Subiendo archivo…';
  if (hasPendingUpload.value) return 'Archivo listo para guardar.';
  return 'PDF de hasta 10 MB.';
});

function fileFromUploadValue(
  value: File | File[] | null | undefined,
): File | undefined {
  if (value == null) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

function csfFileLabel(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const name = pathname.split('/').filter(Boolean).at(-1);
    return name || 'Constancia de situación fiscal';
  } catch {
    return 'Constancia de situación fiscal';
  }
}

async function onPendingFilesChange(value: File | File[] | null | undefined) {
  const file = fileFromUploadValue(value);
  if (!file) {
    if (!isUploading.value) {
      resetPendingUpload();
    }
    return;
  }
  if (isUploading.value || isSaving.value) return;

  pendingFile.value = file;
  await uploadFile(file);
}

function onSaveCsf() {
  void savePendingCsf((url) => {
    csfUrlModel.value = url;
    emit('saved', url);
    pendingFile.value = null;
  });
}

function openCsfUrl() {
  const url = displayUrl.value;
  if (!url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
}
</script>

<template>
  <div class="space-y-4 pt-2">
    <div>
      <h3 class="text-xs font-semibold uppercase tracking-wider text-primary">
        Constancia de situación fiscal
      </h3>
      <p class="mt-1 text-sm text-muted">
        Sube el PDF de la CSF del cliente. El archivo se almacena en Firebase y la URL se guarda en el expediente.
      </p>
    </div>

    <UAlert
      v-if="displayUrl && !hasPendingUpload"
      color="success"
      icon="i-lucide-file-text"
      variant="subtle"
      title="CSF registrada"
    >
      <template #description>
        <button
          type="button"
          class="truncate text-left text-sm text-primary hover:underline"
          @click="openCsfUrl"
        >
          {{ csfFileLabel(displayUrl) }}
        </button>
      </template>
    </UAlert>

    <UFileUpload
      v-model="pendingFile"
      variant="area"
      size="lg"
      layout="list"
      :dropzone="true"
      :preview="true"
      :accept="acceptAttribute"
      :disabled="isSaving"
      :description="uploadDescription"
      :icon="
        hasPendingUpload && !isUploading
          ? 'i-lucide-circle-check'
          : 'i-lucide-upload'
      "
      :label="
        hasPendingUpload && !isUploading
          ? 'Cambiar CSF'
          : 'Subir CSF (PDF)'
      "
      class="w-full"
      :ui="{ base: 'min-h-40' }"
      @update:model-value="onPendingFilesChange"
    />

    <UButton
      block
      color="primary"
      label="Guardar CSF"
      :disabled="isSaving || !hasPendingUpload"
      :loading="isSaving"
      @click="onSaveCsf"
    />
  </div>
</template>
