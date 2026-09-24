<script setup lang="ts">
import {
  PENDING_INVOICE_SEARCH_PLACEHOLDER,
  pendingInvoiceDetailColumns,
  type PendingInvoiceColumnId,
} from '~/constants/pending-invoice';

/**
 * Detalle de Por Facturar del portal de cliente: tabla en desktop, tarjetas
 * en móvil. Los filtros generales llegan por el slot `filters` y las acciones
 * (p. ej. Descargar Excel) por `actions`.
 */
const {
  isInitialLoading,
  isLoadingMore,
  isError,
  errorMessage,
  asyncStatus,
  hasNextPage,
  loadNextPage,
  refresh,
  startDate,
  endDate,
  applyOrdering,
  summary,
  isSummaryLoading,
  isSummaryError,
  controller,
  search,
  downloadingEvidenceKey,
  processingOcRowId,
  searchedRows,
  rows,
  activeFilterCount,
  filtering,
  commentRow,
  isCommentOpen,
  sendAdminDocModalOpen,
  pendingAdminDocRow,
  isSavingAdminDoc,
  openComments,
  openAdminDoc,
  onSendAdminDocSubmit,
  onClearFilters,
  onEvidenceZip,
} = usePendingInvoiceDetailView();

const reportScope = usePendingReportScope();
const { appliedClientIds } = useClientPortalClientFilter();

/** Filtros generales activos (cliente + fechas) más los de columna. */
const mobileFilterCount = computed(
  () =>
    (appliedClientIds.value.length > 0 ? 1 : 0)
    + (isPendingInvoiceDefaultDateRange(startDate.value, endDate.value) ? 0 : 1)
    + activeFilterCount.value,
);

const countLabel = computed(() => {
  if (isSummaryLoading.value) return 'Cargando…';
  // Sin summary, al menos lo que ya está cargado en pantalla.
  if (isSummaryError.value) {
    const loaded = rows.value.length.toLocaleString('es-MX');
    return `${loaded}${hasNextPage.value ? '+' : ''} eventos`;
  }
  const count = summary.value.count;
  return `${count.toLocaleString('es-MX')} evento${count === 1 ? '' : 's'}`;
});

type SortKey = `${'dias' | 'total'}:${'asc' | 'desc'}`;

const SORT_ITEMS: { label: string; value: SortKey; icon: string }[] = [
  { label: 'Más antiguos primero', value: 'dias:desc', icon: 'i-lucide-hourglass' },
  { label: 'Más recientes primero', value: 'dias:asc', icon: 'i-lucide-calendar-clock' },
  { label: 'Mayor total', value: 'total:desc', icon: 'i-lucide-arrow-down-wide-narrow' },
  { label: 'Menor total', value: 'total:asc', icon: 'i-lucide-arrow-up-narrow-wide' },
];

const sortKey = computed<SortKey | undefined>({
  get: () => {
    const column = controller.sortColumn.value;
    if (column !== 'dias' && column !== 'total') return undefined;
    const direction = controller.sortDescending.value ? 'desc' : 'asc';
    return `${column}:${direction}` as SortKey;
  },
  set: (value: SortKey | undefined) => {
    if (!value) return;
    const [column, direction] = value.split(':') as [PendingInvoiceColumnId, 'asc' | 'desc'];
    const meta = pendingInvoiceDetailColumns(reportScope.value).find(
      item => item.id === column,
    );
    if (!meta) return;
    const descending = direction === 'desc';
    controller.applySort(column, descending);
    applyOrdering(meta, descending);
  },
});
</script>

<template>
  <ClientPortalReportShell
    v-model:search="search"
    v-model:sort="sortKey"
    :search-placeholder="PENDING_INVOICE_SEARCH_PLACEHOLDER"
    mobile-search-placeholder="Buscar folio, unidad…"
    :count-label="countLabel"
    :active-filter-count="activeFilterCount"
    :mobile-filter-count="mobileFilterCount"
    :sort-items="SORT_ITEMS"
    :is-initial-loading="isInitialLoading"
    :is-error="isError && rows.length === 0"
    :error-message="errorMessage || 'No se pudo cargar Por Facturar.'"
    :is-loading-more="isLoadingMore"
    loading-more-label="Cargando más eventos…"
    filters-description="Acota los eventos por cliente y rango de fechas."
    @clear-filters="onClearFilters"
    @retry="() => void refresh()"
  >
    <template #filters>
      <slot name="filters" />
    </template>

    <template #actions>
      <slot name="actions" />
    </template>

    <template #desktop>
      <ClientPortalPendingInvoiceTable
        :rows="rows"
        :option-rows="searchedRows"
        :controller="controller"
        :downloading-evidence-key="downloadingEvidenceKey"
        :processing-oc-row-id="processingOcRowId"
        :has-next-page="hasNextPage"
        :load-next-page="loadNextPage"
        :async-status="asyncStatus"
        :filtering="filtering"
        @comment="openComments"
        @admin-doc="openAdminDoc"
        @evidence-zip="onEvidenceZip"
      />
    </template>

    <template #mobile>
      <ClientPortalPendingInvoiceCards
        :rows="rows"
        :downloading-evidence-key="downloadingEvidenceKey"
        :processing-oc-row-id="processingOcRowId"
        :has-next-page="hasNextPage"
        :load-next-page="loadNextPage"
        :async-status="asyncStatus"
        @comment="openComments"
        @admin-doc="openAdminDoc"
        @evidence-zip="onEvidenceZip"
      />
    </template>
  </ClientPortalReportShell>

  <LazyPendingInvoiceCommentModal
    v-model:open="isCommentOpen"
    :row="commentRow"
  />

  <LazyAdministrativeSendAdminDocModal
    v-if="sendAdminDocModalOpen && pendingAdminDocRow"
    v-model:open="sendAdminDocModalOpen"
    :source-rescue-id="pendingAdminDocRow.id"
    :remittance-folio="pendingAdminDocRow.oc ?? ''"
    :invoice-folio="pendingAdminDocRow.factura ?? ''"
    :oc-pdf="pendingAdminDocRow.oc_pdf ?? ''"
    :allow-extra-rescues="false"
    :editable-folios="true"
    :show-invoice-folio="false"
    :loading="isSavingAdminDoc"
    @submit="onSendAdminDocSubmit"
  />
</template>
