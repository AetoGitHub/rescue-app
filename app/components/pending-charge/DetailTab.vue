<script setup lang="ts">
import { refDebounced } from '@vueuse/core';
import { PENDING_CHARGE_DETAIL_COLUMNS } from '~/constants/pending-charge';

const {
  rows: scopedRows,
  isInitialLoading,
  isLoadingMore,
  isError,
  errorMessage,
  asyncStatus,
  hasNextPage,
  loadNextPage,
  refresh,
  selectedClients,
  selectedStatuses,
  clearDetailFilters,
} = usePendingChargeList();
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

const summary = computed(() => summarizePendingChargeRows(filteredRows.value));

function onClearFilters() {
  controller.clearAll();
  clearDetailFilters();
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col gap-3">
    <PendingChargeDetailToolbar
      v-model:search="search"
      :client-count="summary.clientes"
      :total="summary.total"
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
        {{ errorMessage || 'No se pudo cargar Por Cobrar.' }}
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
      <PendingChargeDetailTable
        :rows="rows"
        :option-rows="searchedRows"
        :controller="controller"
        :has-next-page="hasNextPage"
        :load-next-page="loadNextPage"
        :async-status="asyncStatus"
        :filtering="filtering"
      />

      <p
        v-if="isLoadingMore"
        class="text-center text-xs text-muted"
      >
        Cargando más clientes…
      </p>
    </template>
  </div>
</template>
