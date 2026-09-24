<script setup lang="ts">
import { PENDING_INVOICE_TAB_ITEMS } from '~/constants/pending-invoice';
import { PENDING_INVOICE_DEFAULT_ADMIN_STATUS } from '~/constants/pending-invoice-api';
import type { CalendarDateParts } from '~/utils/payment-list-query';
import {
  adminLinkTabsFlexClass,
  adminLinkTabsFlexUi,
} from '~/constants/tabs-layout';
import { adminListPageTitleClass } from '~/constants/admin-list-layout';

usePendingReportScope().value = 'client';

useHead({
  title: 'Por Facturar',
});

const { activeTab, selectedCompanies, startDate, endDate } =
  usePendingInvoiceList();

// Mismo reporte Excel de rescates que /admin/reportes, pero descargado
// directo (sin modal): esta pantalla ya trae su propio filtro de fecha y
// compañía, no hace falta pedirlos otra vez. admin_status queda fijo en
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

  // El reporte Excel solo soporta filtrar por una compañía a la vez; con 0 o
  // varias seleccionadas, se manda sin filtro de compañía (todas).
  if (selectedCompanies.value.length === 1) {
    query.company = String(selectedCompanies.value[0]!.id);
  }

  await downloadRescuesExcelReport(query);
}

function formatHeaderFilterDate(parts: CalendarDateParts) {
  const day = String(parts.day).padStart(2, '0');
  const month = String(parts.month).padStart(2, '0');
  return `${day}/${month}/${parts.year}`;
}

const headerContext = computed(() => {
  const companyCount = selectedCompanies.value.length;
  const companyLabel =
    companyCount > 0
      ? ` · ${companyCount} compañía${companyCount === 1 ? '' : 's'}`
      : '';
  const dateLabel =
    startDate.value != null || endDate.value != null
      ? ` · ${startDate.value != null ? formatHeaderFilterDate(startDate.value) : '…'} – ${endDate.value != null ? formatHeaderFilterDate(endDate.value) : '…'}`
      : '';
  return `${formatPendingInvoiceHeaderDate()} · Remisión + Sin atender${dateLabel}${companyLabel}`;
});
</script>

<template>
  <UDashboardPanel
    :ui="{
      body: 'flex flex-col min-h-0 flex-1 overflow-hidden bg-elevated dark:bg-default',
    }"
  >
    <template #header>
      <SharedNavbar title="Por Facturar" />
    </template>

    <template #body>
      <div class="flex min-h-0 flex-1 flex-col gap-5 p-4 sm:p-6">
        <div
          class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
        >
          <div class="flex flex-col gap-1">
            <p
              class="text-xs font-semibold uppercase tracking-wider text-muted"
            >
              Módulo Cobranza
            </p>
            <h1 :class="adminListPageTitleClass">Por Facturar</h1>
            <p class="text-sm text-muted">
              {{ headerContext }}
            </p>
          </div>

          <div class="flex flex-wrap items-end gap-6 sm:justify-end">
            <ClientPortalClientFilter class="shrink-0" />
            <PendingInvoiceDateRangeFilter class="shrink-0" />
            <PendingInvoiceCompanyFilter class="shrink-0" />
            <UTooltip
              :disabled="canDownloadExcel"
              :text="missingDateMessages.join(' y ')"
            >
              <UButton
                color="neutral"
                icon="i-lucide-download"
                label="Descargar Excel"
                variant="subtle"
                class="shrink-0"
                :loading="isDownloading"
                :disabled="isDownloading || !canDownloadExcel"
                @click="() => void downloadExcel()"
              />
            </UTooltip>
          </div>
        </div>

        <UTabs
          v-model="activeTab"
          :items="[...PENDING_INVOICE_TAB_ITEMS]"
          :class="adminLinkTabsFlexClass"
          :ui="adminLinkTabsFlexUi"
          :unmount-on-hide="false"
          variant="link"
        >
          <template #detail>
            <PendingInvoiceDetailTab />
          </template>
          <template #seller>
            <PendingInvoiceBySellerTab />
          </template>
          <template #matrix>
            <PendingInvoiceCompanyMatrixTab />
          </template>
        </UTabs>
      </div>
    </template>
  </UDashboardPanel>
</template>
