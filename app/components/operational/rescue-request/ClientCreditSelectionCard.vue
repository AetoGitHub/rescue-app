<script setup lang="ts">
import type { ClientCreditSnapshot } from '~/schemas/rescue-create';

const props = defineProps<{
  clientName: string;
  snapshot?: ClientCreditSnapshot | null;
  pending?: boolean;
}>();

const typeBadge = computed(() => {
  const snapshot = props.snapshot;
  if (snapshot != null && isWizardCreditClient(snapshot)) {
    return clientTypeBadgeProps('CREDIT');
  }
  return clientTypeBadgeProps(snapshot?.client_type);
});

const creditAvailableLabel = computed(() =>
  formatClientMoney(props.snapshot?.credit_available),
);
</script>

<template>
  <UCard
    v-if="pending"
    variant="subtle"
    :ui="{ body: 'flex items-center gap-2 py-3 text-sm text-muted' }"
  >
    <UIcon name="i-lucide-loader-circle" class="size-4 shrink-0 animate-spin" />
    Cargando crédito…
  </UCard>

  <UCard
    v-else-if="snapshot"
    variant="subtle"
    :ui="{ body: 'space-y-2 text-sm' }"
  >
    <div class="flex flex-wrap items-center gap-2">
      <span class="font-semibold text-highlighted">
        {{ clientName }}
      </span>
      <UBadge
        :color="typeBadge.color"
        :variant="typeBadge.variant"
        :label="typeBadge.label"
      />
    </div>

    <p class="text-muted">
      Crédito disponible:
      <span class="font-semibold text-highlighted tabular-nums">
        {{ creditAvailableLabel }}
      </span>
    </p>
  </UCard>
</template>
