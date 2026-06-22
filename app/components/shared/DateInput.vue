<script setup lang="ts">
import type { CalendarDate } from '@internationalized/date';

withDefaults(
  defineProps<{
    disabled?: boolean;
    minValue?: CalendarDate;
    maxValue?: CalendarDate;
  }>(),
  {
    disabled: false,
  },
);

const model = defineModel<CalendarDate | null>({ default: null });

const open = ref(false);

const calendarValue = computed({
  get: () => model.value ?? undefined,
  set: (value: CalendarDate | undefined) => {
    model.value = value ?? null;
    open.value = false;
  },
});
</script>

<template>
  <UPopover v-model:open="open" class="w-full">
    <UInputDate
      v-model="model"
      :disabled="disabled"
      :min-value="minValue"
      :max-value="maxValue"
      icon="i-lucide-calendar"
      variant="subtle"
      class="w-full"
      :ui="{ base: 'bg-default' }"
    />

    <template #content>
      <UCalendar
        v-model="calendarValue"
        :min-value="minValue"
        :max-value="maxValue"
        class="p-2"
      />
    </template>
  </UPopover>
</template>
