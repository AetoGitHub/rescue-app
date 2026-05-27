<script setup lang="ts">
import type { SlaFlowDiagramStep } from '~/utils/sla-duration';

defineProps<{
  steps: SlaFlowDiagramStep[];
}>();
</script>

<template>
  <div
    v-if="steps.length === 0"
    class="rounded-lg border border-dashed border-default px-3 py-4 text-sm text-muted"
  >
    Agrega etapas para ver el flujo.
  </div>
  <div
    v-else
    class="flex flex-wrap items-center gap-2 rounded-lg bg-elevated/40 px-3 py-3"
  >
    <template v-for="(step, index) in steps" :key="`${step.fromLabel}-${index}`">
      <span
        class="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium"
        :class="
          step.isOptional
            ? 'border-dashed border-default text-muted'
            : 'border-default bg-default'
        "
      >
        {{ step.fromLabel }}
      </span>
      <span class="text-xs text-muted whitespace-nowrap">
        → {{ step.durationLabel }} →
      </span>
      <span
        class="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium"
        :class="
          step.isOptional
            ? 'border-dashed border-default text-muted'
            : 'border-default bg-default'
        "
      >
        {{ step.toLabel }}
      </span>
      <span
        v-if="index < steps.length - 1"
        class="mx-1 text-muted"
        aria-hidden="true"
      >
        ·
      </span>
    </template>
  </div>
</template>
