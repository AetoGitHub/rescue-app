<script setup lang="ts">
import type { PendingInvoiceRow } from '~/interfaces/invoicing/pending-invoice';

const {
  isInitialLoading,
  isLoadingMore,
  isError,
  errorMessage,
  asyncStatus,
  hasNextPage,
  loadNextPage,
  refresh,
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

function openInOperations(row: PendingInvoiceRow) {
  void navigateTo({
    path: '/admin/operational',
    query: { rescue: String(row.id) },
  });
}

function openDetail(row: PendingInvoiceRow) {
  void navigateTo({
    path: '/admin/administrativo',
    query: { rescue: String(row.id) },
  });
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col gap-3">
    <PendingInvoiceTableFullscreenSection>
      <template #toolbar="{ isFullscreen, toggle }">
        <PendingInvoiceDetailToolbar
          v-model:search="search"
          :event-count="summary.count"
          :sub-total="summary.sub_total"
          :is-summary-loading="isSummaryLoading"
          :is-summary-error="isSummaryError"
          :active-filter-count="activeFilterCount"
          :is-fullscreen="isFullscreen"
          :toggle-fullscreen="toggle"
          @clear-filters="onClearFilters"
        />
      </template>

      <div
        v-if="isInitialLoading"
        class="flex min-h-48 flex-1 items-center justify-center rounded-lg border border-muted bg-default"
      >
        <UIcon
          name="i-lucide-loader-circle"
          class="size-6 animate-spin text-muted"
        />
      </div>

      <div
        v-else-if="isError && rows.length === 0"
        class="flex min-h-48 flex-1 flex-col items-center justify-center gap-3 rounded-lg border border-muted bg-default p-6 text-center"
      >
        <p class="text-sm text-muted">
          {{ errorMessage || 'No se pudo cargar Por Facturar.' }}
        </p>
        <UButton
          color="neutral"
          variant="subtle"
          icon="i-lucide-refresh-cw"
          label="Reintentar"
          @click="() => void refresh()"
        />
      </div>

      <template v-else>
        <PendingInvoiceDetailTable
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
          @attention="openInOperations"
          @detail="openDetail"
          @admin-doc="openAdminDoc"
          @evidence-zip="onEvidenceZip"
        />

        <p
          v-if="isLoadingMore"
          class="text-center text-xs text-muted"
        >
          Cargando más eventos…
        </p>
      </template>
    </PendingInvoiceTableFullscreenSection>

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
  </div>
</template>
