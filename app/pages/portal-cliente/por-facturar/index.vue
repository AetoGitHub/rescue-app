<script setup lang="ts">
import { PENDING_INVOICE_DEFAULT_ADMIN_STATUS } from '~/constants/pending-invoice-api';
import type { CalendarDateParts } from '~/utils/payment-list-query';
import { adminListPageTitleClass } from '~/constants/admin-list-layout';

usePendingReportScope().value = 'client';

useHead({
  title: 'Por Facturar',
});

const { startDate, endDate } = usePendingInvoiceList();

// Mismo reporte Excel de rescates que /admin/reportes, pero descargado
// directo (sin modal): esta pantalla ya trae su propio filtro de fecha, no
// hace falta pedirlo otra vez. admin_status queda fijo en
// "Sin atender" + "En remisión" -- el mismo alcance que ya muestra esta vista.
const { downloadRescuesExcelReport, isDownloading } = useRescuesExcelReportDownload();

const missingDateMessages = computed(() => {
  const messages: string[] = [];
  if (startDate.value == null) messages.push('Falta la fecha "Desde"');
  if (endDate.value == null) messages.push('Falta la fecha "Hasta"');
  return messages;
});
const canDownloadExcel = computed(() => missingDateMessages.value.length === 0);

async function downloadExcel() {
  if (startDate.value == null || endDate.value == null) return;

  const query: Record<string, string | undefined> = {
    admin_status: PENDING_INVOICE_DEFAULT_ADMIN_STATUS,
    start_date: calendarDateToApiDate(startDate.value),
    end_date: calendarDateToApiDate(endDate.value),
  };

  await downloadRescuesExcelReport(query);
}

const {
  summary,
  isLoading: isSummaryLoading,
  isError: isSummaryError,
} = usePendingInvoiceSummary();

function formatRangeDate(parts: CalendarDateParts) {
  return new Date(parts.year, parts.month - 1, parts.day).toLocaleDateString(
    'es-MX',
    { day: 'numeric', month: 'short', year: 'numeric' },
  );
}

const rangeLabel = computed(() => {
  if (startDate.value == null && endDate.value == null) return 'Todas las fechas';
  const from = startDate.value != null ? formatRangeDate(startDate.value) : '…';
  const to = endDate.value != null ? formatRangeDate(endDate.value) : '…';
  return `${from} – ${to}`;
});
</script>

<template>
  <UDashboardPanel
    :ui="{
      body: 'flex flex-col min-h-0 flex-1 overflow-y-auto bg-elevated lg:overflow-hidden dark:bg-default',
    }"
  >
    <template #header>
      <SharedNavbar title="Por Facturar" />
    </template>

    <template #body>
      <div class="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6 lg:min-h-0 lg:flex-1">
        <header class="flex items-start justify-between gap-3">
          <div class="flex min-w-0 flex-col gap-1">
            <p class="text-[11px] font-semibold uppercase tracking-wider text-primary">
              Módulo Cobranza
            </p>
            <h1 :class="adminListPageTitleClass">Por Facturar</h1>
            <div class="flex flex-col gap-0.5 text-sm text-muted sm:flex-row sm:items-center sm:gap-1.5">
              <span class="inline-flex items-center gap-1.5 text-default">
                <UIcon
                  name="i-lucide-calendar-range"
                  class="size-4 shrink-0 text-muted"
                />
                {{ rangeLabel }}
              </span>
              <span class="hidden text-dimmed sm:inline">·</span>
              <span>En remisión y sin atender</span>
            </div>
          </div>

          <UTooltip
            :disabled="canDownloadExcel"
            :text="missingDateMessages.join(' y ')"
          >
            <UButton
              color="neutral"
              variant="outline"
              icon="i-lucide-file-spreadsheet"
              class="shrink-0 bg-default"
              :loading="isDownloading"
              :disabled="isDownloading || !canDownloadExcel"
              aria-label="Descargar Excel"
              @click="() => void downloadExcel()"
            >
              <span class="hidden sm:inline">Descargar Excel</span>
            </UButton>
          </UTooltip>
        </header>

        <!-- Sin summary no hay totales confiables: mejor no mostrar ceros. -->
        <ClientPortalPendingInvoiceStats
          v-if="!isSummaryError"
          :summary="summary"
          :is-loading="isSummaryLoading"
        />

        <ClientPortalPendingInvoiceDetail>
          <template #filters>
            <ClientPortalClientFilter class="min-w-0" />
            <PendingInvoiceDateRangeFilter />
          </template>
        </ClientPortalPendingInvoiceDetail>
      </div>
    </template>
  </UDashboardPanel>
</template>
