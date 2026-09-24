import { refDebounced } from '@vueuse/core';
import type { PendingInvoiceRow } from '~/interfaces/invoicing/pending-invoice';
import {
  RESCUE_EVIDENCE_ZIP_WEBHOOK_DEFAULT,
} from '~/constants/rescue-evidence-api';
import { pendingInvoiceDetailColumns } from '~/constants/pending-invoice';
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

/**
 * Estado del detalle de Por Facturar: búsqueda, filtros de columna, orden,
 * chat, OC y descarga de evidencias. Lo comparten la vista de admin y la del
 * portal de cliente, que solo cambian la presentación.
 */
export function usePendingInvoiceDetailView() {
  const list = usePendingInvoiceList();
  const {
    scopedRows,
    selectedClients,
    selectedOperators,
    selectedVehicles,
    selectedAuthorizers,
    clearDetailDropdownFilters,
  } = list;
  const summaryState = usePendingInvoiceSummary();
  const controller = usePendingInvoiceColumnFilters();
  const reportScope = usePendingReportScope();
  const apiFetch = useApiFetch();
  const toast = useToast();
  const runtimeConfig = useRuntimeConfig();

  const search = ref('');
  const debouncedSearch = refDebounced(search, 250);
  const downloadingEvidenceKey = ref<string | null>(null);
  const processingOcRowId = ref<number | null>(null);

  usePendingInvoiceViewRefreshListener(() => {
    processingOcRowId.value = null;
  });

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
    const meta = pendingInvoiceDetailColumns(reportScope.value).find(
      column => column.id === columnId,
    );
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

  function openAdminDoc(row: PendingInvoiceRow) {
    pendingAdminDocRow.value = row;
    sendAdminDocModalOpen.value = true;
  }

  async function onSendAdminDocSubmit(body: RescueAdminDocBody) {
    if (isSavingAdminDoc.value) return;
    const rowId = pendingAdminDocRow.value?.id ?? null;
    const ok = await saveAdminDoc(body);
    if (ok) {
      processingOcRowId.value = rowId;
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

  return {
    ...list,
    summary: summaryState.summary,
    isSummaryLoading: summaryState.isLoading,
    isSummaryError: summaryState.isError,
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
  };
}
