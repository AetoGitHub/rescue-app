<script setup lang="ts">
import { RESCUE_EVIDENCE_MODAL_COPY, RESCUE_EVIDENCE_TYPE_SERVICE } from '~/constants/rescue-evidence-api';
import type { RescueEvidence } from '~/interfaces/rescue/evidence';

const props = defineProps<{
  evidences: RescueEvidence[];
  isPending: boolean;
  errorMessage: string;
}>();

const emit = defineEmits<{
  retry: [];
}>();

const previewCopy = RESCUE_EVIDENCE_MODAL_COPY.preview;

const items = computed(() =>
  props.evidences.filter((item) => item.type === RESCUE_EVIDENCE_TYPE_SERVICE),
);

function fileLabel(url: string, index: number) {
  const name = rescueEvidenceUrlBasename(url);
  return name || `Archivo ${index + 1}`;
}

const lightboxOpen = ref(false);
const lightboxUrl = ref('');
const lightboxFileName = ref('');

function openLightbox(item: RescueEvidence, index: number) {
  lightboxUrl.value = item.url;
  lightboxFileName.value = fileLabel(item.url, index);
  lightboxOpen.value = true;
}
</script>

<template>
  <div>
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
      class="flex flex-col items-center gap-3 py-12 text-center"
    >
      <UIcon
        name="i-lucide-triangle-alert"
        class="size-10 text-error"
      />
      <p class="text-sm text-muted">
        {{ errorMessage }}
      </p>
      <UButton
        color="neutral"
        icon="i-lucide-refresh-cw"
        label="Reintentar"
        variant="subtle"
        @click="emit('retry')"
      />
    </div>

    <div
      v-else-if="items.length === 0"
      class="flex flex-col items-center gap-2 py-12 text-center"
    >
      <UIcon
        name="i-lucide-image-off"
        class="size-10 text-muted"
      />
      <p class="text-sm text-muted">
        No hay evidencia disponible
      </p>
    </div>

    <ul
      v-else
      class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
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
        <p class="truncate border-t border-default bg-default px-2 py-1 text-xs text-muted">
          {{ fileLabel(item.url, index) }}
        </p>
      </li>
    </ul>

    <OperationalRescueDetailEvidenceLightboxModal
      v-model:open="lightboxOpen"
      :url="lightboxUrl"
      :file-name="lightboxFileName"
      readonly
    />
  </div>
</template>
