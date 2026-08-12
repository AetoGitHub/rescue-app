<script setup lang="ts">
import { PENDING_INVOICE_TAB_ITEMS } from '~/constants/pending-invoice';
import {
  adminLinkTabsFlexClass,
  adminLinkTabsFlexUi,
} from '~/constants/tabs-layout';
import { adminListPageTitleClass } from '~/constants/admin-list-layout';
import {
  formatPendingInvoiceHeaderDate,
  formatPendingInvoiceMoney,
} from '~/utils/pending-invoice-display';

useHead({
  title: 'Por Facturar',
});

const { activeTab, summary, selectedCompanies } = usePendingInvoiceList();

const headerSubtitle = computed(() => {
  const base = `${formatPendingInvoiceHeaderDate()} · ${summary.value.eventos} eventos · ${formatPendingInvoiceMoney(summary.value.total)} con IVA · Remisión + Sin atender`;

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
      <SharedNavbar title="Por Facturar" />
    </template>

    <template #body>
      <div class="flex min-h-0 flex-1 flex-col gap-5 p-4 sm:p-6">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div class="flex flex-col gap-1">
            <p class="text-xs font-semibold uppercase tracking-wider text-muted">
              Módulo Cobranza
            </p>
            <h1 :class="adminListPageTitleClass">
              Por Facturar
            </h1>
            <p class="text-sm text-muted">
              {{ headerSubtitle }}
            </p>
          </div>

          <PendingInvoiceCompanyFilter class="shrink-0" />
        </div>

        <UTabs
          v-model="activeTab"
          :items="[...PENDING_INVOICE_TAB_ITEMS]"
          :class="adminLinkTabsFlexClass"
          :ui="adminLinkTabsFlexUi"
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
