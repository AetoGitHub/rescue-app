<script setup lang="ts">
import {
  RESCUE_EVIDENCE_MODAL_COPY,
  RESCUE_EVIDENCE_TYPE_SERVICE,
  RESCUE_FIREBASE_UPLOAD_WEBHOOK_DEFAULT,
} from '~/constants/rescue-evidence-api';
import type { RescueEvidence, RescueEvidenceType } from '~/interfaces/rescue/evidence';

const open = defineModel<boolean>('open', { required: true });

const props = withDefaults(
  defineProps<{
    rescueId: number;
    folio: string;
    type?: RescueEvidenceType;
    highlight?: boolean;
    readonly?: boolean;
    externalEvidences?: RescueEvidence[] | null;
  }>(),
  {
    type: undefined,
    highlight: false,
    readonly: false,
    externalEvidences: undefined,
  },
);

const evidenceType = computed(() => props.type ?? RESCUE_EVIDENCE_TYPE_SERVICE);

const copy = computed(() => RESCUE_EVIDENCE_MODAL_COPY[evidenceType.value]);

const modalTitle = computed(() => copy.value.title(props.folio));

const runtimeConfig = useRuntimeConfig();
const webhookUrl = computed(
  () =>
    runtimeConfig.public.firebaseUploadWebhookUrl ||
    RESCUE_FIREBASE_UPLOAD_WEBHOOK_DEFAULT,
);

const toast = useToast();
const pendingFiles = ref<File[]>([]);
const isUploading = ref(false);
const uploadProgress = ref<number | null>(null);
const uploadLabel = ref('');
const {
  guardedOpen,
  discardConfirmOpen,
  requestClose: requestGuardedClose,
  confirmDiscard,
  cancelDiscard,
  resetDirtySnapshot,
} = useDiscardChangesGuard({
  open,
  snapshot: () => ({
    pendingFiles: pendingFiles.value.map((file) => file.name),
    isUploading: isUploading.value,
  }),
});

const rescueIdRef = computed(() => props.rescueId);

const isGuestMode = computed(
  () => props.readonly && props.externalEvidences != null,
);

const {
  evidences: apiEvidences,
  isPending: apiIsPending,
  errorMessage: apiErrorMessage,
  refresh,
} = useRescueEvidenceList(
  computed(() => (isGuestMode.value ? null : props.rescueId)),
);

const evidences = computed(() =>
  isGuestMode.value ? (props.externalEvidences ?? []) : apiEvidences.value,
);

const isPending = computed(() => {
  if (isGuestMode.value) return false;
  return apiIsPending.value;
});

const errorMessage = computed(() => {
  if (isGuestMode.value) return '';
  return apiErrorMessage.value;
});

const items = computed(() =>
  evidences.value.filter((item) => item.type === evidenceType.value),
);

const { createEvidences } = useRescueEvidenceCreate(rescueIdRef);

const acceptAttribute = computed(() =>
  rescueEvidenceAcceptAttribute(evidenceType.value),
);

const fileCountLabel = computed(() =>
  copy.value.fileCountLabel(items.value.length),
);

const dropzoneDescription = computed(() => {
  if (isUploading.value && uploadLabel.value) return uploadLabel.value;
  if (isUploading.value) return RESCUE_EVIDENCE_MODAL_COPY.uploading;
  if (items.value.length === 0) return copy.value.empty;
  return copy.value.subtitle;
});

const canDownloadAll = computed(() => items.value.length > 0);

const isBusy = computed(
  () => !props.readonly && (isPending.value || isUploading.value),
);

async function uploadFiles(files: File[]) {
  const invalid = files.find(
    (file) => !isRescueEvidenceFileAllowed(file, evidenceType.value),
  );
  if (invalid) {
    toast.add({
      title: copy.value.invalidFile,
      color: 'error',
    });
    return;
  }

  isUploading.value = true;
  uploadProgress.value = 0;
  try {
    const storagePath = buildRescueEvidenceStoragePath(
      props.rescueId,
      evidenceType.value,
    );
    const uploaded: { type: RescueEvidenceType; url: string }[] = [];

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index]!;
      uploadLabel.value = RESCUE_EVIDENCE_MODAL_COPY.uploadingFile(
        file.name,
        index + 1,
        files.length,
      );

      const url = await uploadFileToFirebaseGeneral(
        file,
        storagePath,
        webhookUrl.value,
        {
          onProgress: (filePercent) => {
            uploadProgress.value = computeMultiFileUploadProgress(
              index,
              files.length,
              filePercent,
            );
          },
        },
      );
      uploaded.push({ type: evidenceType.value, url });
      uploadProgress.value = computeMultiFileUploadProgress(
        index + 1,
        files.length,
        0,
      );
    }

    await createEvidences({ evidences: uploaded });
    await refresh();
    toast.add({
      title: copy.value.uploadSuccess,
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
    uploadProgress.value = null;
    uploadLabel.value = '';
  }
}

async function onPendingFilesChange(value: File[] | null | undefined) {
  const files = value?.length ? [...value] : [];
  if (!files.length || isBusy.value) return;

  await uploadFiles(files);
  pendingFiles.value = [];
}

const dropzoneRef = ref<HTMLElement | null>(null);

function scrollDropzoneIntoView() {
  nextTick(() => {
    dropzoneRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

watch(open, (isOpen, wasOpen) => {
  if (!isOpen && wasOpen && isUploading.value) {
    open.value = true;
    toast.add({
      title: RESCUE_EVIDENCE_MODAL_COPY.uploadInProgressCloseBlocked,
      color: 'warning',
    });
    return;
  }

  if (isOpen) {
    resetDirtySnapshot();
    if (!isGuestMode.value) void refresh();
    if (props.highlight && !props.readonly) scrollDropzoneIntoView();
  } else {
    pendingFiles.value = [];
  }
});

function requestClose() {
  if (isUploading.value) {
    toast.add({
      title: RESCUE_EVIDENCE_MODAL_COPY.uploadInProgressCloseBlocked,
      color: 'warning',
    });
    return;
  }
  requestGuardedClose();
}

watch(
  () => props.highlight,
  (active) => {
    if (active && open.value) scrollDropzoneIntoView();
  },
);

function openEvidenceUrl(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

function fileLabel(url: string, index: number) {
  try {
    const pathname = new URL(url).pathname;
    const name = pathname.split('/').filter(Boolean).at(-1);
    return name || `Archivo ${index + 1}`;
  } catch {
    return `Archivo ${index + 1}`;
  }
}
</script>

<template>
  <UModal
    v-model:open="guardedOpen"
    :dismissible="false"
    :title="modalTitle"
    :description="copy.subtitle"
    :ui="{ content: 'max-w-2xl' }"
  >
    <template #body>
      <div
        v-if="!readonly"
        ref="dropzoneRef"
        class="mb-4 rounded-lg transition-shadow"
        :class="highlight ? 'ring-2 ring-error p-1' : ''"
      >
        <div
          v-if="highlight"
          class="mb-2 flex justify-end"
        >
          <UBadge
            color="error"
            label="Requerida para continuar"
            size="sm"
          />
        </div>
        <UFileUpload
          v-model="pendingFiles"
          multiple
          variant="area"
          size="lg"
          icon="i-lucide-upload"
          :accept="acceptAttribute"
          :disabled="isBusy"
          :preview="false"
          :dropzone="true"
          :label="copy.dropzoneLabel"
          :description="dropzoneDescription"
          class="w-full"
          :class="isUploading ? 'pointer-events-none opacity-80' : ''"
          :ui="{ base: 'min-h-48' }"
          @update:model-value="onPendingFilesChange"
        />
      </div>

      <div
        v-if="!readonly && isUploading"
        class="mb-4 space-y-2"
      >
        <UProgress
          :model-value="uploadProgress"
          status
          size="md"
          color="primary"
        />
        <p class="text-center text-sm text-muted">
          {{ uploadLabel || RESCUE_EVIDENCE_MODAL_COPY.uploading }}
        </p>
      </div>

      <div
        v-if="isPending"
        class="flex justify-center py-12"
      >
        <UIcon
          name="i-lucide-loader-circle"
          class="size-8 animate-spin text-muted"
        />
      </div>

      <div
        v-else-if="errorMessage"
        class="flex flex-col items-center gap-3 py-8 text-center"
      >
        <p class="text-sm text-error">
          {{ errorMessage }}
        </p>
        <UButton
          color="neutral"
          icon="i-lucide-refresh-cw"
          label="Reintentar"
          variant="subtle"
          size="sm"
          @click="() => void refresh()"
        />
      </div>

      <div
        v-else-if="items.length === 0"
        class="flex flex-col items-center gap-2 py-8 text-center"
      >
        <p class="text-sm text-muted">
          {{ copy.empty }}
        </p>
      </div>

      <ul
        v-else
        class="divide-y divide-default rounded-lg border border-default"
      >
        <li
          v-for="(item, index) in items"
          :key="item.id"
          class="flex items-center gap-3 px-3 py-2.5"
        >
          <UIcon
            :name="getRescueEvidenceFileIcon(item.url)"
            class="size-5 shrink-0 text-muted"
          />
          <a
            :href="item.url"
            target="_blank"
            rel="noopener noreferrer"
            class="min-w-0 flex-1 truncate text-sm text-primary hover:underline"
          >
            {{ fileLabel(item.url, index) }}
          </a>
          <UButton
            color="neutral"
            icon="i-lucide-external-link"
            variant="ghost"
            size="xs"
            aria-label="Abrir archivo"
            @click="openEvidenceUrl(item.url)"
          />
        </li>
      </ul>
    </template>

    <template #footer>
      <div class="flex w-full flex-wrap items-center justify-between gap-3">
        <span class="text-sm text-muted">
          {{ fileCountLabel }}
        </span>
        <div class="flex flex-wrap gap-2">
          <UButton
            v-if="canDownloadAll"
            color="primary"
            icon="i-lucide-archive"
            :label="RESCUE_EVIDENCE_MODAL_COPY.downloadAll"
            variant="solid"
            size="sm"
            disabled
          />
          <UButton
            color="neutral"
            :label="RESCUE_EVIDENCE_MODAL_COPY.close"
            variant="outline"
            :disabled="isUploading"
            @click="requestClose"
          />
        </div>
      </div>
    </template>
  </UModal>

  <SharedDiscardChangesConfirmModal
    v-model:open="discardConfirmOpen"
    @confirm="confirmDiscard"
    @cancel="cancelDiscard"
  />
</template>

