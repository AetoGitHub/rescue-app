<script setup lang="ts">
import type { TmsRowSaveStatus } from '~/interfaces/portals/tms';

defineProps<{
  status: TmsRowSaveStatus;
  error?: string | null;
  dirty?: boolean;
}>();
</script>

<template>
  <UBadge
    v-if="status === 'saving'"
    color="neutral"
    variant="subtle"
    size="sm"
    icon="i-lucide-loader-circle"
    label="Guardando"
    :ui="{ leadingIcon: 'animate-spin' }"
  />
  <UBadge
    v-else-if="status === 'saved'"
    color="success"
    variant="subtle"
    size="sm"
    icon="i-lucide-check"
    label="Guardado"
  />
  <UTooltip
    v-else-if="status === 'error'"
    :text="error || 'No se pudo guardar el cambio'"
  >
    <UBadge
      color="error"
      variant="subtle"
      size="sm"
      icon="i-lucide-triangle-alert"
      label="Sin guardar"
    />
  </UTooltip>
  <UBadge
    v-else-if="dirty"
    color="warning"
    variant="subtle"
    size="sm"
    label="Borrador"
  />
</template>
