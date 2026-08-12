import type { PendingInvoiceColumnId } from '~/constants/pending-invoice';
import type { PendingInvoiceColumnFilters } from '~/utils/pending-invoice-aggregate';

/** Excel-like per-column state for the detail table: value checkboxes plus sort. */
export function usePendingInvoiceColumnFilters(
  defaultSortColumn: PendingInvoiceColumnId = 'dias',
) {
  const columnFilters = ref<PendingInvoiceColumnFilters>({});
  const sortColumn = ref<PendingInvoiceColumnId | null>(defaultSortColumn);
  const sortDescending = ref(true);

  const activeFilterCount = computed(
    () =>
      Object.values(columnFilters.value).filter(
        values => values != null && values.length > 0,
      ).length,
  );

  function selectionFor(columnId: PendingInvoiceColumnId): string[] {
    return columnFilters.value[columnId] ?? [];
  }

  function setSelection(columnId: PendingInvoiceColumnId, values: string[]) {
    const entries = Object.entries(columnFilters.value).filter(
      ([key]) => key !== columnId,
    );
    if (values.length > 0) entries.push([columnId, values]);
    columnFilters.value = Object.fromEntries(entries);
  }

  function isFiltered(columnId: PendingInvoiceColumnId): boolean {
    return selectionFor(columnId).length > 0;
  }

  function applySort(columnId: PendingInvoiceColumnId, descending: boolean) {
    sortColumn.value = columnId;
    sortDescending.value = descending;
  }

  function clearAll() {
    columnFilters.value = {};
  }

  return {
    columnFilters,
    sortColumn,
    sortDescending,
    activeFilterCount,
    selectionFor,
    setSelection,
    isFiltered,
    applySort,
    clearAll,
  };
}
