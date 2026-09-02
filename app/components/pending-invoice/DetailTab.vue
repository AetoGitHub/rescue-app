<script setup lang="ts">
import { refDebounced } from '@vueuse/core';
import type { PendingInvoiceRow } from '~/interfaces/invoicing/pending-invoice';
import {
  RESCUE_EVIDENCE_ZIP_WEBHOOK_DEFAULT,
} from '~/constants/rescue-evidence-api';
import { PENDING_INVOICE_DETAIL_COLUMNS } from '~/constants/pending-invoice';
import type { RescueAdminDocBody } from '~/schemas/rescue-admin-doc';
import {
  filterPendingInvoiceRows,
  sortPendingInvoiceRows,
} from '~/utils/pending-invoice-aggregate';
import {
  downloadPendingInvoiceEvidenceZip,
  PENDING_INVOICE_EVIDENCE_ZIP_ERROR,
  type PendingInvoiceEvidenceColumn,
} from '~/utils/pending-invoice-evidence';

const {
  scopedRows,
  isInitialLoading,
  isLoadingMore,
  isError,
  errorMessage,
  asyncStatus,
  hasNextPage,
  loadNextPage,
  refresh,
  selectedClients,
  selectedOperators,
  selectedVehicles,
  selectedAuthorizers,
  clearDetailDropdownFilters,
} = usePendingInvoiceList();
const {
  summary,
  isLoading: isSummaryLoading,
  isError: isSummaryError,
} = usePendingInvoiceSummary();
const controller = usePendingInvoiceColumnFilters();
const apiFetch = useApiFetch();
const toast = useToast();
const runtimeConfig = useRuntimeConfig();

const search = ref('');
const debouncedSearch = refDebounced(search, 250);
const downloadingEvidenceKey = ref<string | null>(null);

/** Company filter + free search: also the option source for the column popovers. */
const searchedRows = computed(() =>
  filterPendingInvoiceRows(scopedRows.value, {
    search: debouncedSearch.value,
  }),
);

const filteredRows = computed(() =>
  filterPendingInvoiceRows(searchedRows.value, {
    columnFilters: controller.columnFilters.value,
  }),
);

const rows = computed(() => {
  const columnId = controller.sortColumn.value;
  const meta = PENDING_INVOICE_DETAIL_COLUMNS.find(column => column.id === columnId);
  if (meta?.ordering) return filteredRows.value;
  return sortPendingInvoiceRows(
    filteredRows.value,
    columnId,
    controller.sortDescending.value,
  );
});

const dropdownFilterCount = computed(
  () =>
    [
      selectedClients.value,
      selectedOperators.value,
      selectedVehicles.value,
      selectedAuthorizers.value,
    ].filter(selection => selection.length > 0).length,
);

const activeFilterCount = computed(
  () => controller.activeFilterCount.value + dropdownFilterCount.value,
);

const filtering = computed(
  () =>
    debouncedSearch.value.trim().length > 0
    || activeFilterCount.value > 0,
);

const commentRow = ref<PendingInvoiceRow | null>(null);
const isCommentOpen = ref(false);

const sendAdminDocModalOpen = ref(false);
const pendingAdminDocRow = ref<PendingInvoiceRow | null>(null);
const adminDocRescueId = computed(() => pendingAdminDocRow.value?.id ?? null);
const { save: saveAdminDoc, isSaving: isSavingAdminDoc } =
  useRescueAdminDoc(adminDocRescueId);

function openComments(row: PendingInvoiceRow) {
  commentRow.value = row;
  isCommentOpen.value = true;
}

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

function openAdminDoc(row: PendingInvoiceRow) {
  pendingAdminDocRow.value = row;
  sendAdminDocModalOpen.value = true;
}

async function onSendAdminDocSubmit(body: RescueAdminDocBody) {
  if (isSavingAdminDoc.value) return;
  const ok = await saveAdminDoc(body);
  if (ok) {
    sendAdminDocModalOpen.value = false;
    pendingAdminDocRow.value = null;
  }
}

function onClearFilters() {
  controller.clearAll();
  clearDetailDropdownFilters();
}

async function onEvidenceZip(
  row: PendingInvoiceRow,
  column: PendingInvoiceEvidenceColumn,
) {
  const key = `${row.id}:${column}`;
  if (downloadingEvidenceKey.value === key) return;

  downloadingEvidenceKey.value = key;
  try {
    const filename = await downloadPendingInvoiceEvidenceZip({
      apiFetch,
      rescueId: row.id,
      folio: row.folio,
      column,
      webhookUrl:
        runtimeConfig.public.evidenceZipWebhookUrl ||
        RESCUE_EVIDENCE_ZIP_WEBHOOK_DEFAULT,
    });
    toast.add({
      title: 'Descarga lista',
      description: filename,
      icon: 'i-lucide-archive',
      color: 'success',
    });
  } catch (error) {
    toast.add({
      title: PENDING_INVOICE_EVIDENCE_ZIP_ERROR,
      description: getFetchErrorMessage(error),
      color: 'error',
    });
  } finally {
    downloadingEvidenceKey.value = null;
  }
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col gap-3">
    <PendingInvoiceDetailToolbar
      v-model:search="search"
      :event-count="summary.count"
      :sub-total="summary.sub_total"
      :is-summary-loading="isSummaryLoading"
      :is-summary-error="isSummaryError"
      :active-filter-count="activeFilterCount"
      @clear-filters="onClearFilters"
    />

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
      :loading="isSavingAdminDoc"
      @submit="onSendAdminDocSubmit"
    />
  </div>
</template>
