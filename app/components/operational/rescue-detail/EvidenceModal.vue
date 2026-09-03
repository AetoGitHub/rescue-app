<script setup lang="ts">
import {
  RESCUE_EVIDENCE_MODAL_COPY,
  RESCUE_EVIDENCE_TYPE_SERVICE,
  RESCUE_EVIDENCE_ZIP_WEBHOOK_DEFAULT,
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
const previewCopy = RESCUE_EVIDENCE_MODAL_COPY.preview;

const modalTitle = computed(() => copy.value.title(props.folio));

const runtimeConfig = useRuntimeConfig();
const webhookUrl = computed(
  () =>
    runtimeConfig.public.firebaseUploadWebhookUrl ||
    RESCUE_FIREBASE_UPLOAD_WEBHOOK_DEFAULT,
);
const zipWebhookUrl = computed(
  () =>
    runtimeConfig.public.evidenceZipWebhookUrl ||
    RESCUE_EVIDENCE_ZIP_WEBHOOK_DEFAULT,
);

const toast = useToast();
const pendingFiles = ref<File[]>([]);
const isUploading = ref(false);
const isDownloadingZip = ref(false);
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
  if (isUploading.value || files.length === 0) return;
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

const { isDragging: isFullscreenDragging } = useFullscreenFileDrop({
  model: pendingFiles,
  multiple: true,
  accept: acceptAttribute,
  disabled: isBusy,
  enabled: computed(() => open.value && !props.readonly),
  onFiles: (value) => {
    const files = Array.isArray(value) ? value : value ? [value] : [];
    void onPendingFilesChange(files);
  },
});

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

async function onDownloadAll() {
  if (!canDownloadAll.value || isDownloadingZip.value) return;

  const body = buildRescueEvidenceZipPayload({
    rescueId: props.rescueId,
    folio: props.folio,
    type: evidenceType.value,
    urls: items.value.map((item) => item.url),
  });

  isDownloadingZip.value = true;
  try {
    await requestRescueEvidenceZipDownload(body, zipWebhookUrl.value);
  } catch (error) {
    toast.add({
      title: RESCUE_EVIDENCE_MODAL_COPY.downloadZipError,
      description: getFetchErrorMessage(error),
      color: 'error',
    });
  } finally {
    isDownloadingZip.value = false;
  }
}

function fileLabel(url: string, index: number) {
  const name = rescueEvidenceUrlBasename(url);
  return name || `Archivo ${index + 1}`;
}

const lightboxOpen = ref(false);
const lightboxUrl = ref('');
const lightboxFileName = ref('');
const lightboxEvidenceId = ref<number | null>(null);

function openLightbox(item: RescueEvidence, index: number) {
  lightboxUrl.value = item.url;
  lightboxFileName.value = fileLabel(item.url, index);
  lightboxEvidenceId.value = item.id;
  lightboxOpen.value = true;
}

const { deactivateEvidence, isDeactivating } = useRescueEvidenceDeactivate(rescueIdRef);

const deleteTarget = ref<{ id: number; fileName: string } | null>(null);
const deleteConfirmOpen = computed<boolean>({
  get: () => deleteTarget.value != null,
  set: (value) => {
    if (!value) deleteTarget.value = null;
  },
});
const deleteConfirmDescription = computed(() =>
  previewCopy.deleteConfirmDescription(deleteTarget.value?.fileName ?? ''),
);

function requestDelete(item: RescueEvidence, index: number) {
  deleteTarget.value = { id: item.id, fileName: fileLabel(item.url, index) };
}

async function onConfirmDelete() {
  if (!deleteTarget.value) return;
  const { id } = deleteTarget.value;
  deleteTarget.value = null;
  await deactivateEvidence(id);
}
</script>

<template>
  <UModal
    v-model:open="guardedOpen"
    :dismissible="false"
    :close="{ disabled: isUploading }"
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
        class="grid grid-cols-2 gap-3 sm:grid-cols-3"
      >
        <li
          v-for="(item, index) in items"
          :key="item.id"
          class="group relative overflow-hidden rounded-lg border border-default"
        >
          <button
            type="button"
            class="relative block aspect-square w-full cursor-pointer"
            :aria-label="fileLabel(item.url, index)"
            @click="openLightbox(item, index)"
          >
            <OperationalRescueDetailEvidencePreviewContent
              :url="item.url"
              :file-name="fileLabel(item.url, index)"
              size="thumb"
            />
            <div
              class="pointer-events-none absolute inset-0 flex items-center justify-center gap-1 bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
            >
              <UIcon
                name="i-lucide-eye"
                class="size-4"
              />
              <span class="text-xs font-medium">{{ previewCopy.viewDetail }}</span>
            </div>
          </button>
          <div
            class="absolute right-1 top-1 flex gap-1 opacity-0 shadow transition-opacity group-hover:opacity-100 focus-within:opacity-100"
          >
            <UButton
              v-if="!readonly"
              color="error"
              icon="i-lucide-trash-2"
              variant="solid"
              size="xs"
              square
              :loading="isDeactivating(item.id)"
              :disabled="isDeactivating(item.id)"
              aria-label="Eliminar evidencia"
              @click.stop="requestDelete(item, index)"
            />
            <UButton
              color="neutral"
              icon="i-lucide-external-link"
              variant="solid"
              size="xs"
              square
              aria-label="Abrir en pestaña nueva"
              @click.stop="openEvidenceUrl(item.url)"
            />
          </div>
          <p class="truncate border-t border-default bg-default px-2 py-1 text-xs text-muted">
            {{ fileLabel(item.url, index) }}
          </p>
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
            :label="
              isDownloadingZip
                ? RESCUE_EVIDENCE_MODAL_COPY.downloadingZip
                : RESCUE_EVIDENCE_MODAL_COPY.downloadAll
            "
            variant="solid"
            size="sm"
            :loading="isDownloadingZip"
            :disabled="isDownloadingZip"
            @click="() => void onDownloadAll()"
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

  <SharedDiscardChangesConfirmModal
    v-model:open="deleteConfirmOpen"
    :title="previewCopy.deleteConfirmTitle"
    :description="deleteConfirmDescription"
    :cancel-label="previewCopy.deleteCancelLabel"
    :confirm-label="previewCopy.deleteConfirmLabel"
    @confirm="onConfirmDelete"
  />

  <SharedFullscreenFileDropOverlay
    :active="isFullscreenDragging"
    label="Suelta los archivos para subirlos"
  />

  <OperationalRescueDetailEvidenceLightboxModal
    v-model:open="lightboxOpen"
    :url="lightboxUrl"
    :file-name="lightboxFileName"
    :evidence-id="lightboxEvidenceId"
    :rescue-id="rescueId"
    :readonly="readonly"
  />
</template>

