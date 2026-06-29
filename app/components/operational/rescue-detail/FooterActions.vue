<script setup lang="ts">
import type { RescueCardDetail } from '~/interfaces/rescue/detail';
import type { RescueEvidence } from '~/interfaces/rescue/evidence';
import type { RescueOperativeActionId } from '~/interfaces/rescue/operative';
import { applyCloseEvidenceGuard } from '~/utils/rescue-evidence-requirements';
import { applyCloseSupplierGuard } from '~/utils/rescue-supplier-assign';
import {
  getMoreOptionsActions,
  getRescueDetailFooterActions,
  getRescueDetailFooterFlowLabel,
  rescueDetailToFlowContext,
} from '~/utils/rescue-operative-flow';

const props = defineProps<{
  detail: RescueCardDetail;
  evidences?: RescueEvidence[];
  loading?: boolean;
}>();

const emit = defineEmits<{
  action: [id: RescueOperativeActionId];
}>();

const flowContext = computed(() => rescueDetailToFlowContext(props.detail));

const footerActions = computed(() =>
  applyCloseSupplierGuard(
    applyCloseEvidenceGuard(
      getRescueDetailFooterActions(flowContext.value),
      props.evidences ?? [],
    ),
    props.detail,
  ),
);

const flowLabel = computed(() =>
  getRescueDetailFooterFlowLabel(flowContext.value),
);

const moreOptions = computed(() => getMoreOptionsActions(flowContext.value));

const primaryActions = computed(() =>
  footerActions.value.filter((a) => a.primary),
);

const secondaryActions = computed(() =>
  footerActions.value.filter((a) => !a.primary),
);

const dropdownItems = computed(() => {
  if (moreOptions.value.length === 0) return [];
  return [
    moreOptions.value.map((item) => ({
      label: item.label,
      color: item.color === 'error' ? ('error' as const) : undefined,
      onSelect: () => emit('action', item.id),
    })),
  ];
});

function onAction(id: RescueOperativeActionId) {
  emit('action', id);
}
</script>

<template>
  <div class="flex w-full flex-col-reverse gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
    <p class="text-xs text-muted">
      {{ flowLabel }}
    </p>
    <div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
      <UButton
        v-for="action in primaryActions"
        :key="action.id"
        :color="action.color ?? 'primary'"
        :variant="action.variant ?? 'solid'"
        :label="action.label"
        :disabled="action.disabled || loading"
        :title="action.disabledReason"
        @click="onAction(action.id)"
      />
      <UButton
        v-for="action in secondaryActions"
        :key="action.id"
        :color="action.color ?? 'neutral'"
        :variant="action.variant ?? 'outline'"
        :label="action.label"
        :disabled="action.disabled || loading"
        @click="onAction(action.id)"
      />
      <UDropdownMenu
        v-if="dropdownItems.length > 0"
        :items="dropdownItems"
      >
        <UButton
          color="neutral"
          icon="i-lucide-ellipsis"
          variant="outline"
          aria-label="Más opciones"
          :disabled="loading"
        />
      </UDropdownMenu>
    </div>
  </div>
</template>
