<script setup lang="ts">
import { useQuoteClassifierApply } from '~/composables/useQuoteClassifierApply';
import { QUOTE_CLASSIFIER_IMAGE_ACCEPT } from '~/constants/quote-classifier-api';
import { RESCUE_FIREBASE_UPLOAD_WEBHOOK_DEFAULT } from '~/constants/rescue-evidence-api';
import type { QuoteClassifierApplyPayload } from '~/interfaces/rescue/quote-classifier';

const emit = defineEmits<{
  applyLines: [payload: QuoteClassifierApplyPayload];
}>();

const toast = useToast();
const runtimeConfig = useRuntimeConfig();

const webhookUrl = computed(
  () =>
    runtimeConfig.public.firebaseUploadWebhookUrl ||
    RESCUE_FIREBASE_UPLOAD_WEBHOOK_DEFAULT,
);

const promptText = ref('');
const pendingFile = ref<File | null>(null);

const { isBusy, lastNotes, lastNotesHasUnmatched, classifyInput } =
  useQuoteClassifierApply({
    onApplyLines: (payload) => emit('applyLines', payload),
  });

const canSubmitText = computed(
  () => promptText.value.trim().length > 0 && !isBusy.value,
);

async function onSubmitText() {
  const input = promptText.value.trim();
  if (!input || isBusy.value) return;
  await classifyInput(input, 'text');
}

function fileFromUploadValue(
  value: File | File[] | null | undefined,
): File | undefined {
  if (value == null) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

async function onPendingFilesChange(value: File | File[] | null | undefined) {
  const file = fileFromUploadValue(value);
  if (!file || isBusy.value) return;

  if (!isQuoteClassifierImageAllowed(file)) {
    toast.add({
      title: 'Archivo no válido',
      description: 'Solo imágenes JPG, PNG, WEBP o GIF de hasta 10 MB.',
      color: 'error',
    });
    pendingFile.value = null;
    return;
  }

  isBusy.value = true;
  try {
    const storagePath = buildQuoteClassifierStoragePath(file.name);
    const imageUrl = await uploadFileToFirebaseGeneral(
      file,
      storagePath,
      webhookUrl.value,
    );
    await classifyInput(imageUrl, 'image');
  } catch (error) {
    toast.add({
      title: 'No se pudo procesar la imagen',
      description: getFetchErrorMessage(error),
      color: 'error',
    });
    isBusy.value = false;
  } finally {
    pendingFile.value = null;
  }
}
</script>

<template>
  <div class="space-y-3">
    <div class="rounded-lg border border-default bg-elevated/20 p-4 space-y-4">
      <div class="flex items-start gap-2 text-sm text-muted">
        <UIcon
          name="i-lucide-sparkles"
          class="mt-0.5 size-4 shrink-0 text-primary"
        />
        <p>
          Describe los conceptos en lenguaje natural y la IA los mapeará al
          catálogo.
        </p>
      </div>

      <UTextarea
        v-model="promptText"
        class="w-full"
        :rows="4"
        placeholder='Ej: "2 horas de mano de obra a $400 c/u, una grúa de plataforma costo $1,200 y diagnóstico"'
        :disabled="isBusy"
      />

      <UFileUpload
        v-model="pendingFile"
        variant="area"
        size="sm"
        icon="i-lucide-image"
        :accept="QUOTE_CLASSIFIER_IMAGE_ACCEPT"
        :disabled="isBusy"
        :preview="false"
        :dropzone="false"
        layout="list"
        label="Subir captura de cotización"
        :description="
          isBusy ? 'Procesando imagen…' : 'JPG, PNG, WEBP o GIF (máx. 10 MB)'
        "
        class="w-full"
        @update:model-value="onPendingFilesChange"
      />

      <div class="flex justify-end">
        <UButton
          type="button"
          color="primary"
          icon="i-lucide-sparkles"
          label="Generar servicios"
          :loading="isBusy"
          :disabled="!canSubmitText"
          @click="onSubmitText"
        />
      </div>
    </div>

    <UAlert
      v-if="lastNotes.length > 0"
      :color="lastNotesHasUnmatched ? 'warning' : 'success'"
      variant="subtle"
      icon="i-lucide-info"
      title="Notas del clasificador"
    >
      <ul class="list-disc space-y-1 ps-4 text-sm">
        <li v-for="(note, index) in lastNotes" :key="index">
          {{ note }}
        </li>
      </ul>
    </UAlert>
  </div>
</template>
