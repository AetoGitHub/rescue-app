import { refDebounced } from '@vueuse/core';
import { PENDING_CHARGE_DETAIL_COLUMNS } from '~/constants/pending-charge';

/**
 * Estado del detalle de Por Cobrar: búsqueda, filtros de columna y orden.
 * Lo comparten la vista de admin y la del portal de cliente, que solo cambian
 * la presentación.
 */
export function usePendingChargeDetailView() {
  const list = usePendingChargeList();
  const {
    rows: scopedRows,
    selectedClients,
    selectedStatuses,
    clearDetailFilters,
  } = list;
  const summaryState = usePendingChargeSummary();
  const controller = usePendingChargeColumnFilters();

  const search = ref('');
  const debouncedSearch = refDebounced(search, 250);

  const searchedRows = computed(() =>
    filterPendingChargeRows(scopedRows.value, {
      search: debouncedSearch.value,
    }),
  );

  const filteredRows = computed(() =>
    filterPendingChargeRows(searchedRows.value, {
      columnFilters: controller.columnFilters.value,
      statuses: selectedStatuses.value,
    }),
  );

  const rows = computed(() => {
    const columnId = controller.sortColumn.value;
    const meta = PENDING_CHARGE_DETAIL_COLUMNS.find(column => column.id === columnId);
    if (meta?.ordering) return filteredRows.value;
    return sortPendingChargeRows(
      filteredRows.value,
      columnId,
      controller.sortDescending.value,
    );
  });

  const dropdownFilterCount = computed(
    () =>
      [selectedClients.value, selectedStatuses.value].filter(
        selection => selection.length > 0,
      ).length,
  );

  const activeFilterCount = computed(
    () => controller.activeFilterCount.value + dropdownFilterCount.value,
  );

  const filtering = computed(
    () =>
      debouncedSearch.value.trim().length > 0
      || activeFilterCount.value > 0,
  );

  function onClearFilters() {
    controller.clearAll();
    clearDetailFilters();
  }

  return {
    ...list,
    scopedRows,
    summary: summaryState.summary,
    isSummaryLoading: summaryState.isLoading,
    isSummaryError: summaryState.isError,
    controller,
    search,
    searchedRows,
    rows,
    activeFilterCount,
    filtering,
    onClearFilters,
  };
}
