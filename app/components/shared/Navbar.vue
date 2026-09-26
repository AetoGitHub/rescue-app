<script setup lang="ts">
interface Props {
  title: string;
}

defineProps<Props>();

const isClearingCache = ref(false);
const clearCacheConfirmOpen = ref(false);

function onClearCache() {
  if (isClearingCache.value) return;
  clearCacheConfirmOpen.value = true;
}

function confirmClearCache() {
  clearCacheConfirmOpen.value = false;
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

  <SharedDiscardChangesConfirmModal
    v-model:open="clearCacheConfirmOpen"
    title="¿Borrar caché y recargar?"
    description="Se eliminará la caché guardada en este navegador y la página se recargará para cargar la versión más reciente del sistema. Úsalo si ves información desactualizada o algo no carga bien. No se borra ningún dato ni se cierra tu sesión, pero perderás lo que tengas capturado sin guardar."
    cancel-label="Cancelar"
    confirm-label="Borrar caché y recargar"
    @confirm="confirmClearCache"
  />
</template>
