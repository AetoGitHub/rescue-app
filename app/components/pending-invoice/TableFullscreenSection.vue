<script setup lang="ts">
import { useFullscreen } from '@vueuse/core';

const sectionRef = ref<HTMLElement | null>(null);
const { isFullscreen, toggle } = useFullscreen(sectionRef);
</script>

<template>
  <div
    ref="sectionRef"
    :class="[
      'flex min-h-0 flex-1 flex-col gap-2',
      isFullscreen ? 'bg-elevated p-4 dark:bg-default sm:p-6' : '',
    ]"
  >
    <slot
      name="toolbar"
      :is-fullscreen="isFullscreen"
      :toggle="toggle"
    />

    <div class="flex min-h-0 flex-1 flex-col">
      <slot />
    </div>
  </div>
</template>
