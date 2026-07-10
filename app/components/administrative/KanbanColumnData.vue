<script setup lang="ts">
import type { AdministrativeBillingStatus } from '~/constants/administrative-kanban';
import type { AdministrativeBoardFilters } from '~/interfaces/administrative/board-filters';

const props = defineProps<{
  status: AdministrativeBillingStatus;
  title: string;
  accentColor: string;
  filters: AdministrativeBoardFilters;
}>();

const emit = defineEmits<{
  select: [card: import('~/interfaces/rescue/administrative').AdministrativeRescueCard];
  count: [status: AdministrativeBillingStatus, count: number];
}>();

const {
  rows,
  asyncStatus,
  hasNextPage,
  loadNextPage,
  isInitialLoading,
  isLoadingMore,
  isInitialError,
  isLoadMoreError,
  errorMessage,
  refresh,
} = useAdministrativeRescueCards(() => props.status, () => props.filters);

const {
  subtotalLabel,
  isLoading: isSubtotalLoading,
  refresh: refreshSummary,
} = useAdministrativeRescueCardsSummary(() => props.status, () => props.filters);

const displayRows = computed(() =>
  filterAdministrativeCardsLocally(rows.value, props.filters),
);

watch(
  displayRows,
  (cards) => {
    emit('count', props.status, cards.length);
  },
  { immediate: true },
);

const renderError = ref<string | null>(null);

onErrorCaptured((err) => {
  renderError.value = err instanceof Error ? err.message : String(err);
  return false;
});

const columnErrorMessage = computed(
  () => renderError.value ?? errorMessage.value,
);
const columnHasError = computed(
  () => isInitialError.value || renderError.value != null,
);

const columnRef = ref<{
  scrollContainerRef: HTMLElement | null;
} | null>(null);

const scrollContainerRef = computed(
  () => columnRef.value?.scrollContainerRef ?? null,
);

useScrollContainerInfiniteLoad({
  containerRef: scrollContainerRef,
  hasNextPage,
  loadNextPage,
  asyncStatus,
  disabled: computed(() => columnHasError.value || isLoadMoreError.value),
});

function retryColumn() {
  renderError.value = null;
  void Promise.all([refresh(), refreshSummary()]);
}
</script>

<template>
  <AdministrativeKanbanColumn
    ref="columnRef"
    :title="title"
    :accent-color="accentColor"
    :subtotal-label="subtotalLabel"
    :is-subtotal-loading="isSubtotalLoading"
    :items="displayRows"
    :count="displayRows.length"
    :is-initial-loading="isInitialLoading"
    :is-loading-more="isLoadingMore"
    :is-error="columnHasError"
    :is-load-more-error="isLoadMoreError"
    :error-message="columnErrorMessage"
    @retry="retryColumn"
  >
    <template #default="{ item }">
      <AdministrativeKanbanCard
        :card="item"
        @select="emit('select', $event)"
      />
    </template>
  </AdministrativeKanbanColumn>
</template>
