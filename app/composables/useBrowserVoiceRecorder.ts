const PREFERRED_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/mp4',
];

function resolveRecorderMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;

  for (const mimeType of PREFERRED_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }

  return undefined;
}

function extensionFromMimeType(mimeType: string | undefined): string {
  if (!mimeType) return 'webm';
  if (mimeType.includes('ogg')) return 'ogg';
  if (mimeType.includes('mp4')) return 'mp4';
  return 'webm';
}

function stopMediaStream(stream: MediaStream | null) {
  if (stream == null) return;
  for (const track of stream.getTracks()) {
    track.stop();
  }
}

export function useBrowserVoiceRecorder() {
  const isSupported = computed(
    () =>
      typeof window !== 'undefined'
      && typeof navigator !== 'undefined'
      && Boolean(navigator.mediaDevices?.getUserMedia)
      && typeof MediaRecorder !== 'undefined',
  );

  const isRecording = ref(false);
  const error = ref<string | null>(null);
  const durationMs = ref(0);
  const recordedBlob = ref<Blob | null>(null);
  const previewUrl = ref<string | null>(null);
  const recordedExtension = ref('webm');

  let mediaStream: MediaStream | null = null;
  let mediaRecorder: MediaRecorder | null = null;
  let recordingMimeType: string | undefined;
  let chunks: BlobPart[] = [];
  let durationTimer: ReturnType<typeof setInterval> | null = null;
  let recordingStartedAt = 0;

  function clearPreviewUrl() {
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value);
      previewUrl.value = null;
    }
  }

  function resetRecording() {
    clearPreviewUrl();
    recordedBlob.value = null;
    durationMs.value = 0;
    error.value = null;
    recordedExtension.value = 'webm';
  }

  function stopDurationTimer() {
    if (durationTimer != null) {
      clearInterval(durationTimer);
      durationTimer = null;
    }
  }

  function cleanupActiveRecorder() {
    stopDurationTimer();
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    mediaRecorder = null;
    chunks = [];
    stopMediaStream(mediaStream);
    mediaStream = null;
    isRecording.value = false;
  }

  async function startRecording() {
    if (!isSupported.value || isRecording.value) return;

    resetRecording();

    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingMimeType = resolveRecorderMimeType();
      recordedExtension.value = extensionFromMimeType(recordingMimeType);

      mediaRecorder = recordingMimeType
        ? new MediaRecorder(mediaStream, { mimeType: recordingMimeType })
        : new MediaRecorder(mediaStream);

      chunks = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onerror = () => {
        error.value = 'No se pudo grabar la nota de voz';
        cleanupActiveRecorder();
      };

      mediaRecorder.onstop = () => {
        stopDurationTimer();
        stopMediaStream(mediaStream);
        mediaStream = null;
        isRecording.value = false;

        if (chunks.length === 0) return;

        const blobType = recordingMimeType ?? mediaRecorder?.mimeType ?? 'audio/webm';
        recordedBlob.value = new Blob(chunks, { type: blobType });
        clearPreviewUrl();
        previewUrl.value = URL.createObjectURL(recordedBlob.value);
        chunks = [];
        mediaRecorder = null;
      };

      recordingStartedAt = Date.now();
      durationMs.value = 0;
      durationTimer = setInterval(() => {
        durationMs.value = Date.now() - recordingStartedAt;
      }, 200);

      mediaRecorder.start();
      isRecording.value = true;
    } catch {
      error.value = 'No se pudo acceder al micrófono';
      cleanupActiveRecorder();
    }
  }

  function stopRecording() {
    if (!isRecording.value || mediaRecorder == null) return;
    mediaRecorder.stop();
  }

  onUnmounted(() => {
    cleanupActiveRecorder();
    clearPreviewUrl();
  });

  return {
    isSupported,
    isRecording,
    error,
    durationMs,
    recordedBlob,
    previewUrl,
    recordedExtension,
    startRecording,
    stopRecording,
    resetRecording,
  };
}
