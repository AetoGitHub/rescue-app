<script setup lang="ts">
import type { ClientPortalStat } from '~/components/client-portal/SummaryStats.vue';

usePendingReportScope().value = 'client';

useHead({
  title: 'Por cobrar',
});

const {
  summary,
  isLoading: isSummaryLoading,
  isError: isSummaryError,
} = usePendingChargeSummary();

const stats = computed<ClientPortalStat[]>(() => [
  {
    key: 'count',
    label: 'Facturas',
    hint: 'sin pagar',
    value: summary.value.count.toLocaleString('es-MX'),
    icon: 'i-lucide-file-text',
  },
  {
    key: 'total',
    label: 'Total por cobrar',
    value: formatPendingInvoiceMoney(summary.value.total),
    icon: 'i-lucide-hand-coins',
    accent: true,
  },
]);
</script>

<template>
  <UDashboardPanel
    :ui="{
      body: 'flex flex-col min-h-0 flex-1 overflow-y-auto bg-elevated lg:overflow-hidden dark:bg-default',
    }"
  >
    <template #header>
      <SharedNavbar title="Por cobrar" />
    </template>

    <template #body>
      <div class="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6 lg:min-h-0 lg:flex-1">
        <ClientPortalReportHeader title="Por cobrar">
          <template #meta>
            <span class="inline-flex items-center gap-1.5 text-default">
              <UIcon
                name="i-lucide-calendar"
                class="size-4 shrink-0 text-muted"
              />
              Al {{ formatPendingInvoiceHeaderDate() }}
            </span>
            <span class="hidden text-dimmed sm:inline">·</span>
            <span>Facturado sin pagar</span>
          </template>

          <!-- Sin summary no hay totales confiables: mejor no mostrar ceros. -->
          <template
            v-if="!isSummaryError"
            #stats
          >
            <ClientPortalSummaryStats
              :stats="stats"
              :is-loading="isSummaryLoading"
              class="xl:ms-auto xl:max-w-2xl"
            />
          </template>
        </ClientPortalReportHeader>

        <ClientPortalPendingChargeDetail>
          <template #filters>
            <ClientPortalClientFilter class="min-w-0" />
          </template>
        </ClientPortalPendingChargeDetail>
      </div>
    </template>
  </UDashboardPanel>
</template>
