<script setup lang="ts">
import { useInfiniteScroll } from '@vueuse/core';
import type { CatalogDropdownFetcher } from '~/composables/useCatalogDropdown';
import type { CatalogDropdownRow } from '~/interfaces/shared/catalog-dropdown.interface';
import type { PendingInvoiceFilterSelection } from '~/interfaces/invoicing/pending-invoice';

const props = withDefaults(
  defineProps<{
    fetcher: CatalogDropdownFetcher;
    searchPlaceholder?: string;
  }>(),
  {
    searchPlaceholder: 'Buscar…',
  },
);

const selected = defineModel<PendingInvoiceFilterSelection[]>('selected', {
  required: true,
});

const listEl = ref<HTMLElement | null>(null);

const {
  searchTerm,
  items,
  loading,
  loadingMore,
  errorMessage,
  hasNextPage,
  loadNextPage,
} = useCatalogDropdown((name, options) => props.fetcher(name, options), {
  infinite: 'cursor',
});

useInfiniteScroll(
  listEl,
  () => {
    if (hasNextPage.value && !loadingMore.value) {
      void loadNextPage();
    }
  },
  { distance: 80 },
);

const selectedIds = computed(() => new Set(selected.value.map(row => row.id)));

const displayItems = computed(() => {
  const list = [...items.value];
  for (const row of selected.value) {
    if (row.id <= 0) continue;
    if (list.some(item => item.id === row.id)) continue;
    list.unshift({ id: row.id, name: row.name });
  }
  return list;
});

function isSelected(id: number): boolean {
  return selectedIds.value.has(id);
}

function toggle(row: CatalogDropdownRow, checked: boolean) {
  if (checked) {
    if (isSelected(row.id)) return;
    selected.value = [
      ...selected.value.filter(item => item.id !== row.id),
      { id: row.id, name: row.name },
    ];
    return;
  }
  selected.value = selected.value.filter(item => item.id !== row.id);
}

function clear() {
  selected.value = [];
}

defineExpose({
  resetSearch: () => {
    searchTerm.value = '';
  },
});
</script>

<template>
  <div class="flex flex-col gap-2">
    <UInput
      v-model="searchTerm"
      icon="i-lucide-search"
      size="sm"
      variant="subtle"
      autofocus
      :placeholder="searchPlaceholder"
    />

    <div class="flex items-center justify-between gap-2 text-xs">
      <span class="text-dimmed">
        {{
          selected.length === 0
            ? 'Sin filtro: se muestran todos los valores'
            : `${selected.length} seleccionada${selected.length === 1 ? '' : 's'}`
        }}
      </span>
      <UButton
        color="neutral"
        variant="link"
        size="xs"
        class="px-0"
        :disabled="selected.length === 0"
        label="Limpiar"
        @click="clear"
      />
    </div>

    <div
      ref="listEl"
      class="-mx-1 max-h-56 overflow-y-auto px-1"
    >
      <div
        v-if="loading"
        class="flex items-center justify-center py-6"
      >
        <UIcon
          name="i-lucide-loader-circle"
          class="size-4 animate-spin text-muted"
        />
      </div>

      <p
        v-else-if="errorMessage"
        class="py-4 text-center text-xs text-error"
      >
        {{ errorMessage }}
      </p>

      <p
        v-else-if="displayItems.length === 0"
        class="py-4 text-center text-xs text-muted"
      >
        Sin coincidencias
      </p>

      <div
        v-for="option in displayItems"
        :key="option.id"
        class="py-1"
      >
        <UCheckbox
          :model-value="isSelected(option.id)"
          :label="option.name"
          size="sm"
          :ui="{ label: 'truncate' }"
          @update:model-value="(checked) => toggle(option, checked === true)"
        />
      </div>

      <div
        v-if="loadingMore"
        class="flex items-center justify-center py-2"
      >
        <UIcon
          name="i-lucide-loader-circle"
          class="size-3.5 animate-spin text-muted"
        />
      </div>
    </div>
  </div>
</template>
