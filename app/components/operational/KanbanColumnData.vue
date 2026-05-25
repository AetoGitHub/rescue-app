<script setup lang="ts">
import type { OperationalRescueStatus } from '~/constants/operational-kanban';

const props = defineProps<{
  status: OperationalRescueStatus;
  title: string;
  accentColor: string;
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
} = useOperationalRescueCards(() => props.status);

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

const scrollDisabled = computed(
  () => columnHasError.value || isLoadMoreError.value,
);

useScrollContainerInfiniteLoad({
  containerRef: scrollContainerRef,
  hasNextPage,
  loadNextPage,
  asyncStatus,
  disabled: scrollDisabled,
});

function retryColumn() {
  renderError.value = null;
  void refresh();
}
</script>

<template>
  <OperationalKanbanColumn
    ref="columnRef"
    :title="title"
    :accent-color="accentColor"
    :items="rows"
    :is-initial-loading="isInitialLoading"
    :is-loading-more="isLoadingMore"
    :is-error="columnHasError"
    :is-load-more-error="isLoadMoreError"
    :error-message="columnErrorMessage"
    @retry="retryColumn"
  >
    <template #default="{ item }">
      <OperationalRescueCard :card="item" />
    </template>
  </OperationalKanbanColumn>
</template>
