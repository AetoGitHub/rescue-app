<script setup lang="ts">
import { PENDING_CHARGE_SEARCH_PLACEHOLDER } from '~/constants/pending-charge';

const props = defineProps<{
  clientCount: number;
  total: number;
  activeFilterCount: number;
}>();

const emit = defineEmits<{
  clearFilters: [];
}>();

const search = defineModel<string>('search', { required: true });

const summaryLabel = computed(
  () =>
    `${props.clientCount} cliente${props.clientCount === 1 ? '' : 's'} · ${formatPendingInvoiceMoney(props.total)} c/IVA`,
);
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
      <p class="text-sm whitespace-nowrap text-muted">
        {{ summaryLabel }}
      </p>
    </div>
  </div>
</template>
