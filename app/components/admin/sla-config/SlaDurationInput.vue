<script setup lang="ts">
import type { SlaDurationUnit } from '~/interfaces/sla';
import { SLA_DURATION_UNITS } from '~/constants/sla-config';

const props = withDefaults(
  defineProps<{
    minutes: number;
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

const emit = defineEmits<{
  'update:minutes': [value: number];
}>();

const unit = ref<SlaDurationUnit>('minutes');
const displayValue = ref(0);

const borderClass = computed(() => {
  if (props.variant === 'amber') return 'ring-1 ring-warning/60 rounded-md';
  if (props.variant === 'red') return 'ring-1 ring-error/60 rounded-md';
  return '';
});

function syncFromMinutes(value: number) {
  const resolvedUnit = props.minutesOnly
    ? 'minutes'
    : inferBestDurationUnit(value);
  unit.value = resolvedUnit;
  displayValue.value = minutesToDisplay(value, resolvedUnit);
}

watch(
  () => props.minutes,
  (value) => syncFromMinutes(value),
  { immediate: true },
);

function onValueChange(value: number | null | undefined) {
  const safe = value ?? 0;
  displayValue.value = safe;
  const resolvedUnit = props.minutesOnly ? 'minutes' : unit.value;
  emit('update:minutes', displayToMinutes(safe, resolvedUnit));
}

function onUnitChange(value: SlaDurationUnit) {
  unit.value = value;
  emit('update:minutes', displayToMinutes(displayValue.value, value));
}

const preview = computed(() => formatSlaDurationPreview(props.minutes));
</script>

<template>
  <div class="flex flex-col gap-1">
    <div class="flex gap-2" :class="borderClass">
      <UInputNumber
        :model-value="displayValue"
        v-bind="catalogIntegerInputProps"
        class="min-w-0 flex-1"
        :disabled="disabled"
        @update:model-value="onValueChange"
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
