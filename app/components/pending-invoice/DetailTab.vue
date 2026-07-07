<script setup lang="ts">
import { refDebounced } from '@vueuse/core';
import type {
  PendingInvoiceDetailRow,
  PendingInvoiceSummary,
} from '~/interfaces/invoicing/pending-invoice';
import type { PendingInvoiceDetailFilters } from '~/interfaces/invoicing/pending-invoice-filters';
import { hasActivePendingInvoiceDetailFilters } from '~/utils/pending-invoice-filters';

const filters = defineModel<PendingInvoiceDetailFilters>('filters', {
  required: true,
});

defineProps<{
  summary?: PendingInvoiceSummary | null;
}>();

const emit = defineEmits<{
  select: [row: PendingInvoiceDetailRow];
}>();

const debouncedSearch = refDebounced(
  computed(() => filters.value.search),
  300,
);

const queryFilters = computed(() => ({
  ...filters.value,
  search: debouncedSearch.value,
}));

const {
  rows,
  asyncStatus,
  hasNextPage,
  loadNextPage,
  isInitialLoading,
  isError,
  errorMessage,
} = usePendingInvoiceDetail(queryFilters);

const hasActiveFilters = computed(() =>
  hasActivePendingInvoiceDetailFilters(filters.value),
);
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col gap-3">
    <PendingInvoiceDetailFilters v-model:filters="filters" />

    <PendingInvoiceDetailToolbar
      :summary="summary"
      :row-count="rows.length"
      :has-next-page="hasNextPage"
      :has-active-filters="hasActiveFilters"
    />

    <UAlert
      v-if="isError"
      color="error"
      variant="subtle"
      title="No se pudo cargar el detalle"
      :description="errorMessage"
    />

    <PendingInvoiceDetailTable
      v-else
      :rows="rows"
      :loading="isInitialLoading"
      :has-next-page="hasNextPage"
      :load-next-page="loadNextPage"
      :async-status="asyncStatus"
      @select="emit('select', $event)"
    />
  </div>
</template>
