<script setup lang="ts">
import type { MapPinLegendItem } from '~/constants/supplier-map-pins';

defineProps<{
  items: MapPinLegendItem[];
}>();
</script>

<template>
  <div
    class="pointer-events-none absolute bottom-3 left-3 z-10 max-w-[min(100%,14rem)] rounded-lg border border-default bg-default/95 px-3 py-2 shadow-sm"
  >
    <p class="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
      Leyenda
    </p>
    <ul class="space-y-1">
      <li
        v-for="item in items"
        :key="item.label"
        class="flex items-center gap-2 text-xs text-default"
      >
        <span
          class="size-2.5 shrink-0 rounded-full border"
          :style="{
            backgroundColor: item.color,
            borderColor: item.borderColor ?? item.color,
          }"
        />
        <span class="min-w-0 leading-snug">{{ item.label }}</span>
      </li>
    </ul>
  </div>
</template>
