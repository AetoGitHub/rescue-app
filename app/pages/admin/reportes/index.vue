<script setup lang="ts">
useHead({
  title: 'Reportes',
});

// Si se llega desde useReportLauncher (ej. el botón "Exportar a Excel" del
// panel Administrativo), abre el modal correspondiente ya con sus filtros
// precargados. Se lee una sola vez y se limpia para no reabrirse en visitas
// futuras a esta misma página.
const pendingLaunch = useReportLaunch();
const initialLaunch = pendingLaunch.value?.report === 'rescues_excel' ? pendingLaunch.value : null;

onMounted(() => {
  pendingLaunch.value = null;
});

const rescuesExcelModalOpen = ref(initialLaunch != null);
</script>

<template>
  <AdminListPageShell
    navbar-title="Reportes"
    title="Reportes"
    description="Exporta reportes administrativos"
  >
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <UPageCard
        icon="i-lucide-file-spreadsheet"
        title="Reportes de rescates (Excel)"
        description="Descarga un Excel de rescates por rango de fechas"
        variant="subtle"
        class="cursor-pointer text-left transition-colors hover:ring-primary"
        @click="rescuesExcelModalOpen = true"
      />
    </div>

    <ReportesRescuesExcelReportModal
      v-model:open="rescuesExcelModalOpen"
      show-filters
      :initial-company="initialLaunch?.company"
      :initial-client="initialLaunch?.client"
      :initial-status-type="initialLaunch?.statusType"
      :initial-status-values="initialLaunch?.statusValues"
    />
  </AdminListPageShell>
</template>
