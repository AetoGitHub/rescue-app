<script setup lang="ts">
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
  searchedRows,
  rows,
  activeFilterCount,
  filtering,
  onClearFilters,
} = usePendingChargeDetailView();
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col gap-3">
    <PendingChargeDetailToolbar
      v-model:search="search"
      :charge-count="summary.count"
      :sub-total="summary.total"
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
        Cargando más rescates…
      </p>
    </template>
  </div>
</template>
