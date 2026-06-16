<script setup lang="ts">
import {
  QUOTE_CLASSIFIER_IMAGE_ACCEPT,
  QUOTE_CLASSIFY_PATH,
} from '~/constants/quote-classifier-api';
import { RESCUE_FIREBASE_UPLOAD_WEBHOOK_DEFAULT } from '~/constants/rescue-evidence-api';
import type { QuoteClassifierApplyPayload, QuoteClassifierResponse } from '~/interfaces/rescue/quote-classifier';

const emit = defineEmits<{
  applyLines: [payload: QuoteClassifierApplyPayload];
}>();

const apiFetch = useApiFetch();
const toast = useToast();
const runtimeConfig = useRuntimeConfig();

const webhookUrl = computed(
  () =>
    runtimeConfig.public.firebaseUploadWebhookUrl ||
    RESCUE_FIREBASE_UPLOAD_WEBHOOK_DEFAULT,
);

const inputMode = ref<'text' | 'image'>('text');
const promptText = ref('');
const pendingFile = ref<File | null>(null);
const isBusy = ref(false);
const lastNotes = ref<string[]>([]);
const lastNotesHasUnmatched = ref(false);

const inputModeItems = [
  {
    label: 'Texto',
    icon: 'i-lucide-type',
    slot: 'text' as const,
    value: 'text',
  },
  {
    label: 'Imagen',
    icon: 'i-lucide-image',
    slot: 'image' as const,
    value: 'image',
  },
];

const canSubmitText = computed(
  () => promptText.value.trim().length > 0 && !isBusy.value,
);

async function classifyInput(input: string, type: 'text' | 'image') {
  isBusy.value = true;
  lastNotes.value = [];
  lastNotesHasUnmatched.value = false;

  try {
    const response = await apiFetch<QuoteClassifierResponse>(QUOTE_CLASSIFY_PATH, {
      method: 'POST',
      body: { input, type },
    });

    const lines = mapClassifierResponseToQuoteLines(response);
    const notes = normalizeClassifierNotes(response);
    lastNotes.value = notes;
    lastNotesHasUnmatched.value = classifierResponseHasUnmatchedLines(response);

    emit('applyLines', { lines, notes });

    toast.add({
      title: 'Renglones generados',
      description:
        lines.length === 1
          ? 'Se agregó 1 renglón a la cotización.'
          : `Se agregaron ${lines.length} renglones a la cotización.`,
      color: 'success',
    });
  } catch (error) {
    toast.add({
      title: 'No se pudo clasificar la solicitud',
      description: getFetchErrorMessage(error),
      color: 'error',
    });
  } finally {
    isBusy.value = false;
  }
}

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
  <div class="space-y-4">
    <p class="text-sm text-muted">
      Describe el servicio en texto o sube una captura de cotización. La IA
      sugerirá renglones que se agregarán al final de la cotización actual.
    </p>

    <UTabs
      v-model="inputMode"
      :items="inputModeItems"
      variant="pill"
      :unmount-on-hide="false"
      class="w-full"
    >
      <template #text>
        <div class="flex flex-col gap-3 pt-2">
          <UTextarea
            v-model="promptText"
            class="w-full"
            :rows="4"
            placeholder="Ej.: quiero una grúa con 20 km adicionales y maniobras en cochera"
            :disabled="isBusy"
          />
          <UButton
            type="button"
            color="primary"
            icon="i-lucide-sparkles"
            label="Generar renglones"
            block
            :loading="isBusy"
            :disabled="!canSubmitText"
            @click="onSubmitText"
          />
        </div>
      </template>

      <template #image>
        <div class="pt-2">
          <UFileUpload
            v-model="pendingFile"
            variant="area"
            size="lg"
            icon="i-lucide-upload"
            :accept="QUOTE_CLASSIFIER_IMAGE_ACCEPT"
            :disabled="isBusy"
            :preview="false"
            :dropzone="true"
            label="Arrastra una imagen aquí o haz clic para seleccionar"
            :description="
              isBusy
                ? 'Procesando imagen…'
                : 'JPG, PNG, WEBP o GIF (máx. 10 MB)'
            "
            class="w-full"
            :ui="{ base: 'min-h-40' }"
            @update:model-value="onPendingFilesChange"
          />
        </div>
      </template>
    </UTabs>

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
