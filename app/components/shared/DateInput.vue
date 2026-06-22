<script setup lang="ts">
import type { CalendarDate } from '@internationalized/date';

withDefaults(
  defineProps<{
    disabled?: boolean;
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
      icon="i-lucide-calendar"
      variant="subtle"
      class="w-full"
      :ui="{ base: 'bg-default' }"
    />

    <template #content>
      <UCalendar v-model="calendarValue" class="p-2" />
    </template>
  </UPopover>
</template>
