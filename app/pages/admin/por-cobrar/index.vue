<script setup lang="ts">
import { adminListPageTitleClass } from '~/constants/admin-list-layout';

useHead({
  title: 'Por cobrar',
});

const { summary, selectedCompanies } = usePendingChargeList();

const headerSubtitle = computed(() => {
  const base = `${formatPendingInvoiceHeaderDate()} · ${summary.value.clientes} cliente${summary.value.clientes === 1 ? '' : 's'} · ${formatPendingInvoiceMoney(summary.value.total)} con IVA · Facturado sin pagar`;

  const companyCount = selectedCompanies.value.length;
  if (companyCount === 0) return base;

  return `${base} · ${companyCount} compañía${companyCount === 1 ? '' : 's'}`;
});
</script>

<template>
  <UDashboardPanel
    :ui="{
      body: 'flex flex-col min-h-0 flex-1 overflow-hidden bg-elevated dark:bg-default',
    }"
  >
    <template #header>
      <SharedNavbar title="Por cobrar" />
    </template>

    <template #body>
      <div class="flex min-h-0 flex-1 flex-col gap-5 p-4 sm:p-6">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div class="flex flex-col gap-1">
            <p class="text-xs font-semibold uppercase tracking-wider text-muted">
              Módulo Cobranza
            </p>
            <h1 :class="adminListPageTitleClass">
              Por cobrar
            </h1>
            <p class="text-sm text-muted">
              {{ headerSubtitle }}
            </p>
          </div>

          <PendingChargeCompanyFilter class="shrink-0" />
        </div>

        <PendingChargeDetailTab />
      </div>
    </template>
  </UDashboardPanel>
</template>
