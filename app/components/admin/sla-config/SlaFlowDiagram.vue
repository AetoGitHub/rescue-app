<script setup lang="ts">
import type { SlaStatusTimelineItem } from '~/utils/sla-duration';

defineProps<{
  items: SlaStatusTimelineItem[];
}>();
</script>

<template>
  <div
    v-if="items.length === 0"
    class="rounded-lg border border-dashed border-default px-3 py-4 text-sm text-muted"
  >
    Agrega etapas para ver el flujo.
  </div>
  <div
    v-else
    class="flex flex-wrap items-center gap-2 rounded-lg bg-elevated/40 px-3 py-3"
  >
    <template v-for="(item, index) in items" :key="`${item.label}-${index}`">
      <span
        class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"
        :class="
          item.isOptional
            ? 'border-dashed border-default text-muted'
            : 'border-default bg-default'
        "
      >
        {{ item.label }}
        <span class="text-muted">·</span>
        <span class="font-normal text-muted">{{ item.durationLabel }}</span>
      </span>
      <span
        v-if="index < items.length - 1"
        class="text-muted"
        aria-hidden="true"
      >
        →
      </span>
    </template>
  </div>
</template>
