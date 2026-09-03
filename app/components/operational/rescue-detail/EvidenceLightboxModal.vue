<script setup lang="ts">
import { RESCUE_EVIDENCE_MODAL_COPY } from '~/constants/rescue-evidence-api';

const open = defineModel<boolean>('open', { required: true });

const props = withDefaults(
  defineProps<{
    url: string;
    fileName: string;
    evidenceId?: number | null;
    rescueId?: number | null;
    readonly?: boolean;
  }>(),
  {
    evidenceId: null,
    rescueId: null,
    readonly: false,
  },
);

const copy = RESCUE_EVIDENCE_MODAL_COPY.preview;
const { isMobile } = useResponsive();

const modalProps = computed(() =>
  isMobile.value
    ? { fullscreen: true }
    : { ui: { content: 'max-w-4xl' } },
);

function openInNewTab() {
  window.open(props.url, '_blank', 'noopener,noreferrer');
}

const { deactivateEvidence, isDeactivating } = useRescueEvidenceDeactivate(
  computed(() => props.rescueId),
);

const canDelete = computed(() => !props.readonly && props.evidenceId != null);
const isDeleting = computed(() =>
  props.evidenceId != null ? isDeactivating(props.evidenceId) : false,
);

const deleteConfirmOpen = ref(false);
const deleteConfirmDescription = computed(() =>
  copy.deleteConfirmDescription(props.fileName),
);

async function onConfirmDelete() {
  if (props.evidenceId == null) return;
  deleteConfirmOpen.value = false;
  const success = await deactivateEvidence(props.evidenceId);
  if (success) open.value = false;
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="fileName"
    :close="{ disabled: isDeleting }"
    v-bind="modalProps"
  >
    <template #body>
      <OperationalRescueDetailEvidencePreviewContent
        :url="url"
        :file-name="fileName"
        size="full"
      />
    </template>

    <template #footer>
      <div class="flex w-full items-center justify-between gap-2">
        <UButton
          v-if="canDelete"
          color="error"
          variant="subtle"
          icon="i-lucide-trash-2"
          :label="copy.delete"
          :loading="isDeleting"
          :disabled="isDeleting"
          @click="deleteConfirmOpen = true"
        />
        <div class="flex flex-1 justify-end gap-2">
          <UButton
            color="neutral"
            variant="subtle"
            icon="i-lucide-external-link"
            :label="copy.openInNewTab"
            :disabled="isDeleting"
            @click="openInNewTab"
          />
          <UButton
            color="neutral"
            variant="outline"
            :label="copy.close"
            :disabled="isDeleting"
            @click="open = false"
          />
        </div>
      </div>
    </template>
  </UModal>

  <SharedDiscardChangesConfirmModal
    v-model:open="deleteConfirmOpen"
    :title="copy.deleteConfirmTitle"
    :description="deleteConfirmDescription"
    :cancel-label="copy.deleteCancelLabel"
    :confirm-label="copy.deleteConfirmLabel"
    @confirm="onConfirmDelete"
  />
</template>
