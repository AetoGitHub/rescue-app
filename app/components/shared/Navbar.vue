<script setup lang="ts">
interface Props {
  title: string;
}

defineProps<Props>();

const isClearingCache = ref(false);

function onClearCache() {
  if (isClearingCache.value) return;
  isClearingCache.value = true;
  void clearAppCacheAndReload();
}
</script>

<template>
  <UDashboardNavbar :title="title">
    <template #leading>
      <UDashboardSidebarCollapse />
    </template>

    <template #right>
      <UTooltip text="Borrar caché y recargar">
        <UButton
          color="neutral"
          icon="i-lucide-refresh-ccw"
          variant="ghost"
          aria-label="Borrar caché y recargar"
          :loading="isClearingCache"
          @click="onClearCache"
        />
      </UTooltip>
      <UColorModeSwitch />
      <UButton color="neutral" icon="i-lucide-bell" variant="ghost" />
    </template>
  </UDashboardNavbar>
</template>
