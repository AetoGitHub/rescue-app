<script setup lang="ts">
import type { PendingInvoiceDetailRow } from '~/interfaces/invoicing/pending-invoice';
import type { PendingInvoiceDetailFilters } from '~/interfaces/invoicing/pending-invoice-filters';
import {
  isPendingInvoiceTabValue,
  PENDING_INVOICE_TAB_ITEMS,
  type PendingInvoiceTabValue,
} from '~/constants/pending-invoice-api';
import {
  adminLinkTabsFlexClass,
  adminLinkTabsFlexUi,
} from '~/constants/tabs-layout';
import {
  emptyPendingInvoiceDetailFilters,
  parsePendingInvoiceDetailFiltersFromRoute,
  parsePendingInvoiceMatrixMonths,
  pendingInvoiceDetailFiltersToQuery,
} from '~/utils/pending-invoice-filters';
import { formatPendingInvoiceHeaderDate } from '~/utils/pending-invoice-display';

useHead({
  title: 'Por Facturar',
});

const route = useRoute();
const router = useRouter();
const isSyncing = ref(false);

const detailModalRef = ref<{
  open: (id: number) => void;
  close: () => void;
} | null>(null);

function readTabFromRoute(): PendingInvoiceTabValue {
  const tab = route.query.tab;
  const value = typeof tab === 'string' ? tab : null;
  return isPendingInvoiceTabValue(value) ? value : 'detail';
}

const activeTab = ref<PendingInvoiceTabValue>(readTabFromRoute());
const detailFilters = ref<PendingInvoiceDetailFilters>(
  parsePendingInvoiceDetailFiltersFromRoute(route.query),
);
const matrixMonths = ref(parsePendingInvoiceMatrixMonths(
  typeof route.query.months === 'string' ? route.query.months : null,
));

const {
  summary,
  isInitialLoading: isSummaryLoading,
  isError: isSummaryError,
  errorMessage: summaryErrorMessage,
} = usePendingInvoiceSummary();

const {
  rows: sellerRows,
  totalAmount: sellerTotalAmount,
  footerTotals: sellerFooterTotals,
  isInitialLoading: isSellerLoading,
  isError: isSellerError,
  errorMessage: sellerErrorMessage,
} = usePendingInvoiceBySeller();

const {
  rows: matrixRows,
  monthKeys,
  footerTotals,
  matrixSummary,
  isInitialLoading: isMatrixLoading,
  isError: isMatrixError,
  errorMessage: matrixErrorMessage,
} = usePendingInvoiceCompanyMatrix(matrixMonths);

const headerSubtitle = computed(() => {
  if (summary.value == null) {
    return isSummaryLoading.value
      ? 'Cargando resumen…'
      : 'Remisión + Sin atender';
  }

  return `${formatPendingInvoiceHeaderDate()} · ${summary.value.eventos} eventos · ${formatRescueCardMoney(summary.value.total_con_iva)} con IVA · Remisión + Sin atender`;
});

function buildRouteQuery(): Record<string, string> {
  const query: Record<string, string> = {
    ...pendingInvoiceDetailFiltersToQuery(detailFilters.value),
  };

  if (activeTab.value !== 'detail') {
    query.tab = activeTab.value;
  }

  if (matrixMonths.value !== 6) {
    query.months = String(matrixMonths.value);
  }

  return query;
}

async function syncRouteQuery() {
  isSyncing.value = true;
  try {
    await router.replace({ query: buildRouteQuery() });
  } finally {
    isSyncing.value = false;
  }
}

watch(activeTab, () => {
  void syncRouteQuery();
});

watch(
  detailFilters,
  () => {
    void syncRouteQuery();
  },
  { deep: true },
);

watch(matrixMonths, () => {
  void syncRouteQuery();
});

watch(
  () => route.query,
  () => {
    if (isSyncing.value) return;
    activeTab.value = readTabFromRoute();
    detailFilters.value = parsePendingInvoiceDetailFiltersFromRoute(route.query);
    matrixMonths.value = parsePendingInvoiceMatrixMonths(
      typeof route.query.months === 'string' ? route.query.months : null,
    );
  },
);

function onSelectCompany(compania: string) {
  detailFilters.value = {
    ...emptyPendingInvoiceDetailFilters(),
    search: compania,
  };
  activeTab.value = 'detail';
}

function onSelectDetailRow(row: PendingInvoiceDetailRow) {
  detailModalRef.value?.open(row.id);
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <SharedNavbar title="Por Facturar" />
    </template>
    <template #body>
      <UContainer class="flex flex-col gap-4 pb-6">
        <div class="flex flex-col gap-1">
          <p class="text-xs font-semibold uppercase tracking-wider text-muted">
            Módulo Administración
          </p>
          <h1 class="text-2xl font-bold tracking-tight sm:text-3xl">
            Por Facturar
          </h1>
          <p class="text-sm text-muted">
            {{ headerSubtitle }}
          </p>
        </div>

        <UAlert
          v-if="isSummaryError"
          color="error"
          variant="subtle"
          title="No se pudo cargar el resumen"
          :description="summaryErrorMessage"
        />

        <div class="grid gap-4 sm:grid-cols-3">
          <PendingInvoiceKpiCard
            label="Total c/IVA"
            :value="summary != null ? formatRescueCardMoney(summary.total_con_iva) : '—'"
            :points="summary?.sparkline_14d.total_con_iva"
          />
          <PendingInvoiceKpiCard
            label="Subtotal"
            :value="summary != null ? formatRescueCardMoney(summary.subtotal) : '—'"
            :points="summary?.sparkline_14d.subtotal"
          />
          <PendingInvoiceKpiCard
            label="Eventos"
            :value="summary != null ? String(summary.eventos) : '—'"
            :points="summary?.sparkline_14d.eventos"
          />
        </div>

        <USeparator />

        <UTabs
          v-model="activeTab"
          :items="[...PENDING_INVOICE_TAB_ITEMS]"
          :class="adminLinkTabsFlexClass"
          :ui="adminLinkTabsFlexUi"
          variant="link"
        >
          <template #detail>
            <PendingInvoiceDetailTab
              v-model:filters="detailFilters"
              :summary="summary"
              @select="onSelectDetailRow"
            />
          </template>
          <template #seller>
            <UAlert
              v-if="isSellerError"
              color="error"
              variant="subtle"
              title="No se pudo cargar por responsable"
              :description="sellerErrorMessage"
            />
            <PendingInvoiceBySellerTab
              v-else
              :rows="sellerRows"
              :total-amount="sellerTotalAmount"
              :footer-totals="sellerFooterTotals"
              :loading="isSellerLoading"
            />
          </template>
          <template #matrix>
            <UAlert
              v-if="isMatrixError"
              color="error"
              variant="subtle"
              title="No se pudo cargar la matriz"
              :description="matrixErrorMessage"
            />
            <PendingInvoiceCompanyMatrixTab
              v-else
              v-model:months="matrixMonths"
              :rows="matrixRows"
              :month-keys="monthKeys"
              :matrix-summary="matrixSummary"
              :footer-totals="footerTotals"
              :loading="isMatrixLoading"
              @select-company="onSelectCompany"
            />
          </template>
        </UTabs>
      </UContainer>

      <LazyAdministrativeRescueDetailModal ref="detailModalRef" />
    </template>
  </UDashboardPanel>
</template>
