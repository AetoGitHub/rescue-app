<script setup lang="ts">
import { adminListPageTitleClass } from '~/constants/admin-list-layout';

useHead({
  title: 'Por cobrar',
});

const { selectedCompanies } = usePendingChargeList();
const {
  summary,
  isLoading: isSummaryLoading,
  isError: isSummaryError,
} = usePendingChargeSummary();

const summaryCountLabel = computed(() =>
  isSummaryError.value ? '—' : String(summary.value.count),
);
const summaryTotalLabel = computed(() =>
  isSummaryError.value
    ? '—'
    : formatPendingInvoiceMoney(summary.value.sub_total),
);

const headerContext = computed(() => {
  const companyCount = selectedCompanies.value.length;
  const companyLabel =
    companyCount > 0
      ? ` · ${companyCount} compañía${companyCount === 1 ? '' : 's'}`
      : '';
  return `${formatPendingInvoiceHeaderDate()} · Facturado sin pagar${companyLabel}`;
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
              {{ headerContext }}
            </p>
          </div>

          <div class="flex flex-wrap items-end gap-6 sm:justify-end">
            <div class="flex flex-col gap-0.5">
              <p class="text-[11px] font-medium uppercase tracking-wider text-muted">
                Clientes
              </p>
              <p
                v-if="isSummaryLoading"
                class="text-lg font-semibold tabular-nums text-muted"
              >
                …
              </p>
              <p
                v-else
                class="text-lg font-semibold tabular-nums text-highlighted"
              >
                {{ summaryCountLabel }}
              </p>
            </div>
            <div class="flex flex-col gap-0.5">
              <p class="text-[11px] font-medium uppercase tracking-wider text-muted">
                Total sin IVA
              </p>
              <p
                v-if="isSummaryLoading"
                class="text-lg font-semibold tabular-nums text-muted"
              >
                …
              </p>
              <p
                v-else
                class="text-lg font-semibold tabular-nums text-highlighted"
              >
                {{ summaryTotalLabel }}
              </p>
            </div>
            <PendingChargeCompanyFilter class="shrink-0" />
          </div>
        </div>

        <PendingChargeDetailTab />
      </div>
    </template>
  </UDashboardPanel>
</template>
