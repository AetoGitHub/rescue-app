<script setup lang="ts">
import { CalendarDate, type DateValue } from '@internationalized/date';
import type { CalendarDateParts } from '~/utils/payment-list-query';

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
    minValue?: CalendarDateParts;
    maxValue?: CalendarDateParts;
  }>(),
  {
    disabled: false,
    minValue: undefined,
    maxValue: undefined,
  },
);

const model = defineModel<CalendarDateParts | null>({ default: null });

const open = ref(false);

function toDateValue(
  parts: CalendarDateParts | null | undefined,
): DateValue | undefined {
  if (parts == null) return undefined;
  return new CalendarDate(parts.year, parts.month, parts.day);
}

function fromDateValue(value: DateValue | null | undefined): CalendarDateParts | null {
  if (value == null) return null;
  return { year: value.year, month: value.month, day: value.day };
}

const inputModel = computed({
  get: () => toDateValue(model.value) ?? undefined,
  set: (value: DateValue | undefined) => {
    model.value = fromDateValue(value);
  },
});

const calendarValue = computed({
  get: () => toDateValue(model.value),
  set: (value: DateValue | undefined) => {
    model.value = fromDateValue(value);
    open.value = false;
  },
});

const minDateValue = computed(() => toDateValue(props.minValue));
const maxDateValue = computed(() => toDateValue(props.maxValue));
</script>

<template>
  <UPopover v-model:open="open" class="w-full">
    <UInputDate
      v-model="inputModel"
      :disabled="disabled"
      :min-value="minDateValue"
      :max-value="maxDateValue"
      icon="i-lucide-calendar"
      variant="subtle"
      class="w-full"
      :ui="{ base: 'bg-default' }"
    />

    <template #content>
      <UCalendar
        v-model="calendarValue"
        :min-value="minDateValue"
        :max-value="maxDateValue"
        class="p-2"
      />
    </template>
  </UPopover>
</template>
