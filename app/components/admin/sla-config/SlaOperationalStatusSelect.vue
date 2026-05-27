<script setup lang="ts">
import type { OperationalRescueStatus } from '~/constants/operational-kanban';
import { SLA_OPERATIONAL_STATUS_OPTIONS } from '~/constants/sla-config';

const model = defineModel<OperationalRescueStatus>({ required: true });

defineProps<{
  disabled?: boolean;
}>();

const statusLabel = computed(() => getOperationalStatusLabel(model.value));
</script>

<template>
  <div class="flex flex-col gap-1">
    <USelect
      v-model="model"
      :items="SLA_OPERATIONAL_STATUS_OPTIONS"
      value-key="value"
      class="w-full"
      :disabled="disabled"
    />
    <p class="text-xs text-muted truncate">
      {{ statusLabel }}
    </p>
  </div>
</template>
