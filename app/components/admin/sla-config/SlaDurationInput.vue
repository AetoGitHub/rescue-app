<script setup lang="ts">
import type { SlaDurationUnit } from '~/interfaces/sla';
import { SLA_DURATION_UNITS } from '~/constants/sla-config';

const props = withDefaults(
  defineProps<{
    variant?: 'default' | 'amber' | 'red';
    minutesOnly?: boolean;
    disabled?: boolean;
  }>(),
  {
    variant: 'default',
    minutesOnly: false,
    disabled: false,
  },
);

const time = defineModel<number>('time', { required: true });
const unit = defineModel<SlaDurationUnit>('unit', { required: true });

const borderClass = computed(() => {
  if (props.variant === 'amber') return 'ring-1 ring-warning/60 rounded-md';
  if (props.variant === 'red') return 'ring-1 ring-error/60 rounded-md';
  return '';
});

watch(
  () => props.minutesOnly,
  (minutesOnly) => {
    if (minutesOnly && unit.value !== 'minutes') {
      unit.value = 'minutes';
    }
  },
  { immediate: true },
);

const preview = computed(() => formatSlaTimePreview(time.value, unit.value));

function onTimeChange(value: number | null | undefined) {
  time.value = value ?? 0;
}

function onUnitChange(value: SlaDurationUnit) {
  unit.value = value;
}
</script>

<template>
  <div class="flex flex-col gap-1">
    <div class="flex gap-2" :class="borderClass">
      <UInputNumber
        :model-value="time"
        v-bind="catalogIntegerInputProps"
        class="min-w-0 flex-1"
        :disabled="disabled"
        @update:model-value="onTimeChange"
      />
      <USelect
        v-if="!minutesOnly"
        :model-value="unit"
        :items="SLA_DURATION_UNITS"
        value-key="value"
        class="w-28 shrink-0"
        :disabled="disabled"
        @update:model-value="onUnitChange"
      />
      <span
        v-else
        class="flex shrink-0 items-center px-2 text-xs text-muted"
      >
        min
      </span>
    </div>
    <p class="text-xs text-muted">
      {{ preview }}
    </p>
  </div>
</template>
