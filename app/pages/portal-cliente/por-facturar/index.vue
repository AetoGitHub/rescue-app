<script setup lang="ts">
import { PENDING_INVOICE_DEFAULT_ADMIN_STATUS } from '~/constants/pending-invoice-api';
import type { CalendarDateParts } from '~/utils/payment-list-query';
import type { ClientPortalStat } from '~/components/client-portal/SummaryStats.vue';

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

const stats = computed<ClientPortalStat[]>(() => {
  const { count, sub_total: subTotal, total } = summary.value;
  const iva = Math.max(total - subTotal, 0);
  const countLabel = count.toLocaleString('es-MX');

  return [
    {
      key: 'count',
      label: 'Eventos',
      value: countLabel,
      icon: 'i-lucide-truck',
    },
    {
      key: 'subtotal',
      label: 'Subtotal',
      hint: 'sin IVA',
      value: formatPendingInvoiceMoney(subTotal),
      compactValue: formatPendingInvoiceMoneyCompact(subTotal),
      icon: 'i-lucide-receipt-text',
    },
    {
      key: 'iva',
      label: 'IVA',
      value: formatPendingInvoiceMoney(iva),
      compactValue: formatPendingInvoiceMoneyCompact(iva),
      icon: 'i-lucide-percent',
    },
    {
      key: 'total',
      label: 'Total por facturar',
      value: formatPendingInvoiceMoney(total),
      icon: 'i-lucide-wallet',
      accent: true,
    },
  ];
});
</script>

<template>
  <div class="flex min-h-0 min-w-0 flex-1">
    <!-- Raíz única: UDashboardPanel es un fragmento y la transición del
         portal necesita un elemento para animar. -->
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
          <ClientPortalReportHeader title="Por Facturar">
            <template #meta>
              <span class="inline-flex items-center gap-1.5 text-default">
                <UIcon
                  name="i-lucide-calendar-range"
                  class="size-4 shrink-0 text-muted"
                />
                {{ rangeLabel }}
              </span>
              <span class="hidden text-dimmed sm:inline">·</span>
              <span>En remisión y sin atender</span>
            </template>

            <!-- Sin summary no hay totales confiables: mejor no mostrar ceros. -->
            <template
              v-if="!isSummaryError"
              #stats
            >
              <ClientPortalSummaryStats
                :stats="stats"
                :is-loading="isSummaryLoading"
              />
            </template>
          </ClientPortalReportHeader>

          <ClientPortalPendingInvoiceDetail>
            <template #filters>
              <ClientPortalClientFilter class="min-w-0" />
              <PendingInvoiceDateRangeFilter />
            </template>

            <template #actions>
              <UTooltip
                :disabled="canDownloadExcel"
                :text="missingDateMessages.join(' y ')"
              >
                <UButton
                  color="neutral"
                  variant="outline"
                  size="sm"
                  icon="i-lucide-file-spreadsheet"
                  class="bg-default"
                  :loading="isDownloading"
                  :disabled="isDownloading || !canDownloadExcel"
                  aria-label="Descargar Excel"
                  @click="() => void downloadExcel()"
                >
                  <span class="hidden sm:inline">Excel</span>
                </UButton>
              </UTooltip>
            </template>
          </ClientPortalPendingInvoiceDetail>
        </div>
      </template>
    </UDashboardPanel>
  </div>
</template>
