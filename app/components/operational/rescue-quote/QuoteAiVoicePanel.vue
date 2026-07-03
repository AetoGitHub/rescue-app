<script setup lang="ts">
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

const voiceRecorder = useBrowserVoiceRecorder();
const isVoiceSupported = voiceRecorder.isSupported;
const isVoiceRecording = voiceRecorder.isRecording;
const voiceRecorderError = voiceRecorder.error;
const voiceDurationMs = voiceRecorder.durationMs;
const voiceRecordedBlob = voiceRecorder.recordedBlob;
const voicePreviewUrl = voiceRecorder.previewUrl;
const voiceRecordedExtension = voiceRecorder.recordedExtension;

const { isBusy, lastNotes, lastNotesHasUnmatched, classifyInput } =
  useQuoteClassifierApply({
    onApplyLines: (payload) => emit('applyLines', payload),
  });

const canSubmitVoice = computed(
  () =>
    voiceRecordedBlob.value != null && !isBusy.value && !isVoiceRecording.value,
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

async function onSubmitVoice() {
  const blob = voiceRecordedBlob.value;
  if (!blob || isBusy.value || isVoiceRecording.value) return;

  const filename = buildQuoteClassifierVoiceFilename(
    voiceRecordedExtension.value,
  );
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
  <div class="space-y-3">
    <div class="rounded-lg border border-default bg-elevated/20 p-4 space-y-4">
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
          Graba tu solicitud, escúchala y envíala a la IA (máx. 10 MB).
        </p>

        <div class="flex justify-end">
          <UButton
            type="button"
            color="primary"
            icon="i-lucide-sparkles"
            label="Generar servicios"
            :loading="isBusy"
            :disabled="!canSubmitVoice"
            @click="onSubmitVoice"
          />
        </div>
      </template>
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
