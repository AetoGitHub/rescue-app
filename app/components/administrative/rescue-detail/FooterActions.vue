<script setup lang="ts">
import type {
  RescueAdministrativeActionId,
  RescueAdministrativeFlowContext,
} from '~/interfaces/rescue/administrative';
import {
  getAdministrativeFooterActions,
  getAdministrativeFooterFlowLabel,
} from '~/utils/rescue-administrative-flow';

const props = defineProps<{
  context: RescueAdministrativeFlowContext | null;
  loading?: boolean;
}>();

const emit = defineEmits<{
  action: [id: RescueAdministrativeActionId];
}>();

const actions = computed(() =>
  props.context ? getAdministrativeFooterActions(props.context) : [],
);

const flowLabel = computed(() =>
  props.context ? getAdministrativeFooterFlowLabel(props.context) : '',
);

const primaryActions = computed(() =>
  actions.value.filter((action) => action.primary),
);

const secondaryActions = computed(() =>
  actions.value.filter((action) => !action.primary),
);

function onAction(id: RescueAdministrativeActionId) {
  emit('action', id);
}
</script>

<template>
  <div
    v-if="actions.length"
    class="flex w-full flex-wrap items-center justify-between gap-3"
  >
    <p class="text-xs text-muted">
      Estatus: {{ flowLabel }}
    </p>
    <div class="flex flex-wrap items-center gap-2">
      <UButton
        v-for="action in primaryActions"
        :key="action.id"
        :color="action.color ?? 'primary'"
        :disabled="action.disabled || loading"
        :label="action.label"
        :loading="loading && action.primary"
        variant="solid"
        @click="onAction(action.id)"
      />
      <UButton
        v-for="action in secondaryActions"
        :key="action.id"
        :color="action.color ?? 'neutral'"
        :disabled="action.disabled || loading"
        :label="action.label"
        :variant="action.color === 'error' ? 'outline' : 'subtle'"
        @click="onAction(action.id)"
      />
    </div>
  </div>
</template>
