<script setup lang="ts">
import type { AdministrativeBillingStatus } from '~/constants/administrative-kanban';

const props = defineProps<{
  steps: AdministrativeBillingStatus[];
  currentIndex: number;
}>();

function stepState(index: number): 'completed' | 'current' | 'upcoming' {
  if (index < props.currentIndex) return 'completed';
  if (index === props.currentIndex) return 'current';
  return 'upcoming';
}
</script>

<template>
  <div class="flex w-full items-start gap-0">
    <template
      v-for="(step, index) in steps"
      :key="step"
    >
      <div
        class="flex min-w-0 flex-1 flex-col items-center gap-2"
        :class="index < steps.length - 1 ? '' : 'shrink-0'"
      >
        <div class="flex w-full items-center">
          <div
            v-if="index > 0"
            class="h-px flex-1 bg-default"
            aria-hidden="true"
          />
          <div
            class="flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums transition-colors"
            :class="{
              'bg-primary text-inverted': stepState(index) === 'completed',
              'bg-default text-primary ring-2 ring-primary':
                stepState(index) === 'current',
              'bg-muted text-muted': stepState(index) === 'upcoming',
            }"
          >
            {{ index + 1 }}
          </div>
          <div
            v-if="index < steps.length - 1"
            class="h-px flex-1 bg-default"
            aria-hidden="true"
          />
        </div>
        <span
          class="max-w-full truncate px-1 text-center text-xs uppercase tracking-wide"
          :class="{
            'font-semibold text-primary': stepState(index) === 'current',
            'text-muted': stepState(index) !== 'current',
          }"
        >
          {{ getBillingStatusLabel(step) }}
        </span>
      </div>
    </template>
  </div>
</template>
