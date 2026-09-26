<script setup lang="ts">
import {
  DASHBOARD_REPORT_AUTHORIZER_CREATORS_EXCEL_PATH,
  DASHBOARD_REPORT_SERVICES_EXCEL_PATH,
} from '~/constants/dashboard-report-api';

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
const servicesExcelModalOpen = ref(false);

// Reporte sin filtros: se descarga directo al hacer click en la tarjeta.
const {
  download: downloadAuthorizerCreatorsExcel,
  isDownloading: isDownloadingAuthorizerCreators,
} = useExcelReportDownload(
  DASHBOARD_REPORT_AUTHORIZER_CREATORS_EXCEL_PATH,
  'autorizadores.xlsx',
);
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

      <UPageCard
        icon="i-lucide-file-spreadsheet"
        title="Servicios vendidos (Excel)"
        description="Descarga un Excel de servicios vendidos por rango de fechas"
        variant="subtle"
        class="cursor-pointer text-left transition-colors hover:ring-primary"
        @click="servicesExcelModalOpen = true"
      />

      <UPageCard
        :icon="isDownloadingAuthorizerCreators ? 'i-lucide-loader-circle' : 'i-lucide-file-spreadsheet'"
        title="Autorizadores (Excel)"
        description="Descarga un Excel con todos los autorizadores y quién creó el primer rescate en que se usó cada uno"
        variant="subtle"
        :class="[
          'text-left transition-colors',
          isDownloadingAuthorizerCreators
            ? 'cursor-wait opacity-70 [&_.iconify]:animate-spin'
            : 'cursor-pointer hover:ring-primary',
        ]"
        @click="downloadAuthorizerCreatorsExcel({})"
      />
    </div>

    <ReportesRescuesExcelReportModal
      v-model:open="rescuesExcelModalOpen"
      show-filters
      show-internal-info-option
      :initial-folio="initialLaunch?.folio"
      :initial-service-types="initialLaunch?.serviceTypes"
      :initial-company="initialLaunch?.company"
      :initial-client="initialLaunch?.client"
      :initial-vehicles="initialLaunch?.vehicles"
      :initial-status-type="initialLaunch?.statusType"
      :initial-status-values="initialLaunch?.statusValues"
    />

    <ReportesDateRangeExcelReportModal
      v-model:open="servicesExcelModalOpen"
      title="Reporte de servicios vendidos (Excel)"
      :path="DASHBOARD_REPORT_SERVICES_EXCEL_PATH"
      default-filename="servicios_vendidos.xlsx"
    />
  </AdminListPageShell>
</template>
