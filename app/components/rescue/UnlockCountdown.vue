<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    unlockedUntil: string | null | undefined;
    compact?: boolean;
    showExpiredHint?: boolean;
    expiredHint?: string;
  }>(),
  {
    compact: false,
    showExpiredHint: true,
    expiredHint: 'Tiempo agotado; guarda tus cambios',
  },
);

const { isActive, isExpired, remainingLabel } = useRescueUnlockCountdown(
  () => props.unlockedUntil,
);

const visible = computed(
  () => isActive.value || (isExpired.value && props.showExpiredHint),
);

const label = computed(() => {
  if (isExpired.value && props.showExpiredHint) {
    return props.expiredHint;
  }
  return `Edición: ${remainingLabel.value}`;
});
</script>

<template>
  <UTooltip
    v-if="visible"
    :text="
      isExpired
        ? expiredHint
        : `Tiempo restante para editar: ${remainingLabel}`
    "
  >
    <UBadge
      :color="isExpired ? 'warning' : 'info'"
      :icon="isExpired ? 'i-lucide-clock' : 'i-lucide-lock-open'"
      :label="label"
      :size="compact ? 'sm' : 'md'"
      variant="subtle"
      class="uppercase tracking-wide"
    />
  </UTooltip>
</template>
