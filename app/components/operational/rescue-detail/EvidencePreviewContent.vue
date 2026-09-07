<script setup lang="ts">
import { RESCUE_EVIDENCE_MODAL_COPY } from '~/constants/rescue-evidence-api';

const props = withDefaults(
  defineProps<{
    url: string;
    fileName: string;
    size?: 'thumb' | 'full';
  }>(),
  {
    size: 'thumb',
  },
);

const copy = RESCUE_EVIDENCE_MODAL_COPY.preview;
const kind = computed(() => getRescueEvidenceKind(props.url));
const isZoomed = ref(false);

watch(
  () => props.url,
  () => {
    isZoomed.value = false;
  },
);

function toggleZoom() {
  if (props.size !== 'full' || kind.value !== 'image') return;
  isZoomed.value = !isZoomed.value;
}
</script>

<template>
  <div
    class="flex h-full w-full items-center justify-center overflow-hidden"
    :class="size === 'thumb' ? 'bg-muted/30' : 'bg-muted/10'"
  >
    <img
      v-if="kind === 'image'"
      :src="url"
      :alt="fileName"
      :width="size === 'thumb' ? 300 : undefined"
      :height="size === 'thumb' ? 300 : undefined"
      :loading="size === 'thumb' ? 'lazy' : 'eager'"
      class="h-full w-full"
      :class="
        size === 'thumb'
          ? 'object-cover'
          : isZoomed
            ? 'w-auto max-w-none cursor-zoom-out object-contain'
            : 'max-h-[70vh] cursor-zoom-in object-contain'
      "
      @click="toggleZoom"
    >

    <div
      v-else-if="kind === 'video'"
      class="relative h-full w-full"
    >
      <video
        :src="url"
        preload="metadata"
        class="h-full w-full"
        :class="size === 'thumb' ? 'object-cover' : 'max-h-[70vh] object-contain'"
        :controls="size === 'full'"
        :muted="size === 'thumb'"
        playsinline
      />
      <div
        v-if="size === 'thumb'"
        class="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/10"
      >
        <UIcon
          name="i-lucide-play-circle"
          class="size-8 text-white drop-shadow"
        />
      </div>
    </div>

    <div
      v-else-if="kind === 'audio' && size === 'full'"
      class="flex w-full flex-col items-center gap-4 p-8"
    >
      <UIcon
        name="i-lucide-music"
        class="size-12 text-muted"
      />
      <audio
        :src="url"
        controls
        class="w-full max-w-sm"
      />
    </div>

    <div
      v-else-if="kind === 'pdf' && size === 'full'"
      class="h-[75vh] w-full"
    >
      <iframe
        :src="url"
        :title="fileName"
        class="h-full w-full border-0"
      />
    </div>

    <div
      v-else
      class="flex flex-col items-center gap-2 p-6 text-center"
      :class="size === 'thumb' ? 'gap-1 p-2' : ''"
    >
      <UIcon
        :name="getRescueEvidenceFileIcon(url)"
        :class="size === 'thumb' ? 'size-6' : 'size-10'"
        class="text-muted"
      />
      <p
        v-if="size === 'full'"
        class="max-w-xs truncate text-sm text-muted"
      >
        {{ fileName }}
      </p>
      <p
        v-if="size === 'full' && kind === 'other'"
        class="text-xs text-muted"
      >
        {{ copy.noPreview }}
      </p>
    </div>
  </div>
</template>
