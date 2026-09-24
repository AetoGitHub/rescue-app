<script setup lang="ts">
import {
  PENDING_CHARGE_DETAIL_COLUMNS,
  PENDING_CHARGE_SEARCH_PLACEHOLDER,
  PENDING_CHARGE_STATUS_FILTER_OPTIONS,
  type PendingChargeColumnId,
} from '~/constants/pending-charge';
import type { PendingChargeStatus } from '~/interfaces/invoicing/pending-charge';

/**
 * Detalle de Por Cobrar del portal de cliente: tabla en desktop, tarjetas en
 * móvil y un filtro rápido por estado junto a los filtros generales (slot
 * `filters`).
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
  selectedStatuses,
  applyOrdering,
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

const { appliedClientIds } = useClientPortalClientFilter();

const mobileFilterCount = computed(
  () => (appliedClientIds.value.length > 0 ? 1 : 0) + activeFilterCount.value,
);

const countLabel = computed(() => {
  if (isSummaryLoading.value) return 'Cargando…';
  if (isSummaryError.value) {
    const loaded = rows.value.length.toLocaleString('es-MX');
    return `${loaded}${hasNextPage.value ? '+' : ''} facturas`;
  }
  const count = summary.value.count;
  return `${count.toLocaleString('es-MX')} factura${count === 1 ? '' : 's'}`;
});

const STATUS_DOT: Record<PendingChargeStatus, string> = {
  vencida: 'bg-error',
  por_vencer: 'bg-warning',
  bien: 'bg-success',
  sin_credito: 'bg-neutral-400 dark:bg-neutral-500',
};

function toggleStatus(status: PendingChargeStatus) {
  const current = selectedStatuses.value;
  selectedStatuses.value = current.includes(status)
    ? current.filter(item => item !== status)
    : [...current, status];
}

type SortKey = `${'dias_vencidos' | 'vencimiento' | 'fecha_factura'}:${'asc' | 'desc'}`;

const SORT_ITEMS: { label: string; value: SortKey; icon: string }[] = [
  { label: 'Más atrasadas primero', value: 'dias_vencidos:desc', icon: 'i-lucide-alarm-clock-off' },
  { label: 'Vencen primero', value: 'vencimiento:asc', icon: 'i-lucide-calendar-clock' },
  { label: 'Vencen al final', value: 'vencimiento:desc', icon: 'i-lucide-calendar-arrow-down' },
  { label: 'Facturas más recientes', value: 'fecha_factura:desc', icon: 'i-lucide-file-clock' },
];

const SORT_COLUMNS: PendingChargeColumnId[] = ['dias_vencidos', 'vencimiento', 'fecha_factura'];

const sortKey = computed<SortKey | undefined>({
  get: () => {
    const column = controller.sortColumn.value;
    if (column == null || !SORT_COLUMNS.includes(column)) return undefined;
    const direction = controller.sortDescending.value ? 'desc' : 'asc';
    return `${column}:${direction}` as SortKey;
  },
  set: (value: SortKey | undefined) => {
    if (!value) return;
    const [column, direction] = value.split(':') as [PendingChargeColumnId, 'asc' | 'desc'];
    const meta = PENDING_CHARGE_DETAIL_COLUMNS.find(item => item.id === column);
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
    :search-placeholder="PENDING_CHARGE_SEARCH_PLACEHOLDER"
    mobile-search-placeholder="Buscar folio, RFC…"
    :count-label="countLabel"
    :active-filter-count="activeFilterCount"
    :mobile-filter-count="mobileFilterCount"
    :sort-items="SORT_ITEMS"
    :is-initial-loading="isInitialLoading"
    :is-error="isError && rows.length === 0"
    :error-message="errorMessage || 'No se pudo cargar Por Cobrar.'"
    :is-loading-more="isLoadingMore"
    loading-more-label="Cargando más facturas…"
    filters-description="Acota las facturas por cliente y estado."
    @clear-filters="onClearFilters"
    @retry="() => void refresh()"
  >
    <template #filters>
      <slot name="filters" />

      <div class="flex min-w-0 flex-col gap-1">
        <p class="text-[11px] font-medium uppercase tracking-wider text-muted">
          Estado
        </p>
        <div class="flex flex-wrap gap-1.5">
          <UButton
            v-for="option in PENDING_CHARGE_STATUS_FILTER_OPTIONS"
            :key="option.value"
            color="neutral"
            :variant="selectedStatuses.includes(option.value) ? 'solid' : 'outline'"
            class="rounded-full normal-case"
            :class="selectedStatuses.includes(option.value) ? undefined : 'bg-default'"
            :aria-pressed="selectedStatuses.includes(option.value)"
            @click="toggleStatus(option.value)"
          >
            <span
              class="size-2 rounded-full"
              :class="STATUS_DOT[option.value]"
            />
            {{ option.label }}
          </UButton>
        </div>
      </div>
    </template>

    <template #actions>
      <slot name="actions" />
    </template>

    <template #desktop>
      <ClientPortalPendingChargeTable
        :rows="rows"
        :option-rows="searchedRows"
        :controller="controller"
        :has-next-page="hasNextPage"
        :load-next-page="loadNextPage"
        :async-status="asyncStatus"
        :filtering="filtering"
      />
    </template>

    <template #mobile>
      <ClientPortalPendingChargeCards
        :rows="rows"
        :has-next-page="hasNextPage"
        :load-next-page="loadNextPage"
        :async-status="asyncStatus"
      />
    </template>
  </ClientPortalReportShell>
</template>
