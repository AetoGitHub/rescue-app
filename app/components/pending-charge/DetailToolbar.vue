<script setup lang="ts">
import { PENDING_CHARGE_SEARCH_PLACEHOLDER } from '~/constants/pending-charge';

const props = defineProps<{
  clientCount: number;
  subTotal: number;
  activeFilterCount: number;
  isSummaryLoading?: boolean;
  isSummaryError?: boolean;
}>();

const emit = defineEmits<{
  clearFilters: [];
}>();

const search = defineModel<string>('search', { required: true });

const countLabel = computed(() => {
  const count = props.clientCount;
  return `${count} cliente${count === 1 ? '' : 's'}`;
});
</script>

<template>
  <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
    <UInput
      v-model="search"
      icon="i-lucide-search"
      variant="subtle"
      class="w-full sm:max-w-md"
      :placeholder="PENDING_CHARGE_SEARCH_PLACEHOLDER"
      :ui="{ base: 'bg-default' }"
    >
      <template
        v-if="search"
        #trailing
      >
        <UButton
          color="neutral"
          variant="link"
          size="xs"
          icon="i-lucide-x"
          aria-label="Limpiar búsqueda"
          @click="search = ''"
        />
      </template>
    </UInput>

    <UButton
      v-if="activeFilterCount > 0"
      color="neutral"
      variant="subtle"
      icon="i-lucide-filter-x"
      :label="`Limpiar filtros (${activeFilterCount})`"
      @click="emit('clearFilters')"
    />

    <div class="flex items-center gap-3 sm:ms-auto">
      <p
        v-if="isSummaryLoading"
        class="text-sm whitespace-nowrap text-muted"
      >
        …
      </p>
      <p
        v-else-if="isSummaryError"
        class="text-sm whitespace-nowrap text-muted"
      >
        —
      </p>
      <p
        v-else
        class="text-sm whitespace-nowrap text-muted"
      >
        {{ countLabel }}
        <span class="text-dimmed">·</span>
        <span class="font-medium text-highlighted">Total sin IVA</span>
        <span class="font-semibold tabular-nums text-highlighted">
          {{ formatPendingInvoiceMoney(subTotal) }}
        </span>
      </p>
    </div>
  </div>
</template>
