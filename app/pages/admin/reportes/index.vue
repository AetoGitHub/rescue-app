<script setup lang="ts">
useHead({
  title: 'Reportes',
});

const rescuesExcelModalOpen = ref(false);
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

    <ReportesRescuesExcelReportModal v-model:open="rescuesExcelModalOpen" />
  </AdminListPageShell>
</template>
