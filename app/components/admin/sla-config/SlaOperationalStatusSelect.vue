<script setup lang="ts">
import type { OperationalRescueStatus } from '~/constants/operational-kanban';
import { SLA_ALL_STATUS_OPTIONS } from '~/constants/sla-config';

const model = defineModel<OperationalRescueStatus>({ required: true });

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
    disabledStatuses?: OperationalRescueStatus[];
    excludeStatuses?: OperationalRescueStatus[];
  }>(),
  {
    disabled: false,
    disabledStatuses: () => [],
    excludeStatuses: () => [],
  },
);

const selectItems = computed(() =>
  SLA_ALL_STATUS_OPTIONS.filter(
    (option) => !props.excludeStatuses.includes(option.value),
  ).map((option) => ({
    ...option,
    disabled: props.disabledStatuses.includes(option.value),
  })),
);

const statusLabel = computed(() => getOperationalStatusLabel(model.value));
</script>

<template>
  <div class="flex flex-col gap-1">
    <USelect
      v-model="model"
      :items="selectItems"
      value-key="value"
      class="w-full"
      :disabled="disabled"
    />
    <p class="text-xs text-muted truncate">
      {{ statusLabel }}
    </p>
  </div>
</template>
