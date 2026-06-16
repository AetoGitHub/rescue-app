<script setup lang="ts">
import {
  QUOTE_CLASSIFIER_IMAGE_ACCEPT,
  QUOTE_CLASSIFY_PATH,
} from '~/constants/quote-classifier-api';
import { RESCUE_FIREBASE_UPLOAD_WEBHOOK_DEFAULT } from '~/constants/rescue-evidence-api';
import type {
  QuoteClassifierApplyPayload,
  QuoteClassifierInputType,
  QuoteClassifierResponse,
} from '~/interfaces/rescue/quote-classifier';

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

const inputMode = ref<QuoteClassifierInputType>('text');
const promptText = ref('');
const pendingFile = ref<File | null>(null);
const isBusy = ref(false);
const lastNotes = ref<string[]>([]);
const lastNotesHasUnmatched = ref(false);

const voiceRecorder = useBrowserVoiceRecorder();
const isVoiceSupported = voiceRecorder.isSupported;
const isVoiceRecording = voiceRecorder.isRecording;
const voiceRecorderError = voiceRecorder.error;
const voiceDurationMs = voiceRecorder.durationMs;
const voiceRecordedBlob = voiceRecorder.recordedBlob;
const voicePreviewUrl = voiceRecorder.previewUrl;
const voiceRecordedExtension = voiceRecorder.recordedExtension;

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
  {
    label: 'Voz',
    icon: 'i-lucide-mic',
    slot: 'voice' as const,
    value: 'voice',
  },
];

const canSubmitText = computed(
  () => promptText.value.trim().length > 0 && !isBusy.value,
);

const canSubmitVoice = computed(
  () =>
    voiceRecordedBlob.value != null
    && !isBusy.value
    && !isVoiceRecording.value,
);

function formatRecordingDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

watch(voiceRecorderError, (message) => {
  if (!message) return;
  toast.add({
    title: 'No se pudo grabar',
    description: message,
    color: 'error',
  });
});

async function classifyInput(input: string, type: QuoteClassifierInputType) {
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

async function onSubmitVoice() {
  const blob = voiceRecordedBlob.value;
  if (!blob || isBusy.value || isVoiceRecording.value) return;

  const filename = buildQuoteClassifierVoiceFilename(voiceRecordedExtension.value);
  const file = new File([blob], filename, {
    type: blob.type || 'audio/webm',
  });

  if (!isQuoteClassifierVoiceAllowed(file)) {
    toast.add({
      title: 'Nota de voz no válida',
      description: 'La grabación supera 10 MB o tiene un formato no soportado.',
      color: 'error',
    });
    return;
  }

  isBusy.value = true;
  try {
    const storagePath = buildQuoteClassifierStoragePath(file.name);
    const voiceUrl = await uploadFileToFirebaseGeneral(
      file,
      storagePath,
      webhookUrl.value,
    );
    await classifyInput(voiceUrl, 'voice');
  } catch (error) {
    toast.add({
      title: 'No se pudo procesar la nota de voz',
      description: getFetchErrorMessage(error),
      color: 'error',
    });
    isBusy.value = false;
  } finally {
    voiceRecorder.resetRecording();
  }
}

function onToggleRecording() {
  if (isBusy.value) return;
  if (isVoiceRecording.value) {
    voiceRecorder.stopRecording();
    return;
  }
  voiceRecorder.resetRecording();
  void voiceRecorder.startRecording();
}
</script>

<template>
  <div class="space-y-4">
    <p class="text-sm text-muted">
      Describe el servicio en texto, sube una captura o graba una nota de voz.
      La IA sugerirá renglones que se agregarán al final de la cotización actual.
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

      <template #voice>
        <div class="flex flex-col gap-3 pt-2">
          <div
            v-if="!isVoiceSupported"
            class="rounded-lg border border-dashed border-default px-4 py-6 text-center text-sm text-muted"
          >
            Tu navegador no soporta grabación de voz.
          </div>

          <template v-else>
            <div class="flex flex-wrap items-center gap-3">
              <UButton
                type="button"
                :color="isVoiceRecording ? 'error' : 'primary'"
                :variant="isVoiceRecording ? 'solid' : 'soft'"
                :icon="isVoiceRecording ? 'i-lucide-square' : 'i-lucide-mic'"
                :label="isVoiceRecording ? 'Detener' : 'Grabar'"
                :disabled="isBusy"
                @click="onToggleRecording"
              />

              <span
                v-if="isVoiceRecording"
                class="text-sm font-medium tabular-nums text-error"
              >
                {{ formatRecordingDuration(voiceDurationMs) }}
              </span>

              <span
                v-else-if="voiceRecordedBlob"
                class="text-sm text-muted tabular-nums"
              >
                Duración:
                {{ formatRecordingDuration(voiceDurationMs) }}
              </span>
            </div>

            <audio
              v-if="voicePreviewUrl"
              :src="voicePreviewUrl"
              controls
              class="w-full"
            />

            <p class="text-xs text-muted">
              Graba tu solicitud y escúchala antes de enviarla (máx. 10 MB).
            </p>

            <UButton
              type="button"
              color="primary"
              icon="i-lucide-sparkles"
              label="Generar renglones"
              block
              :loading="isBusy"
              :disabled="!canSubmitVoice"
              @click="onSubmitVoice"
            />
          </template>
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
