import type { PendingChargeColumnId } from '~/constants/pending-charge';
import type { PendingChargeColumnFilters } from '~/utils/pending-charge-aggregate';

/** Excel-like per-column state for the detail table: value checkboxes plus sort. */
export function usePendingChargeColumnFilters(
  defaultSortColumn: PendingChargeColumnId | null = null,
) {
  const columnFilters = ref<PendingChargeColumnFilters>({});
  const sortColumn = ref<PendingChargeColumnId | null>(defaultSortColumn);
  const sortDescending = ref(true);

  const activeFilterCount = computed(
    () =>
      Object.values(columnFilters.value).filter(
        values => values != null && values.length > 0,
      ).length,
  );

  function selectionFor(columnId: PendingChargeColumnId): string[] {
    return columnFilters.value[columnId] ?? [];
  }

  function setSelection(columnId: PendingChargeColumnId, values: string[]) {
    const entries = Object.entries(columnFilters.value).filter(
      ([key]) => key !== columnId,
    );
    if (values.length > 0) entries.push([columnId, values]);
    columnFilters.value = Object.fromEntries(entries);
  }

  function applySort(columnId: PendingChargeColumnId, descending: boolean) {
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
    applySort,
    clearAll,
  };
}
