<script setup lang="ts">
import { useInfiniteScroll } from '@vueuse/core';
import type { CatalogDropdownFetcher } from '~/composables/useCatalogDropdown';
import type { CatalogDropdownRow } from '~/interfaces/shared/catalog-dropdown.interface';
import {
  PENDING_INVOICE_COMPANY_DROPDOWN_PATH,
} from '~/constants/pending-invoice-api';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';

const { selectedCompanies, clearCompanies } = usePendingInvoiceList();
const apiFetch = useApiFetch();

const open = ref(false);
const listEl = ref<HTMLElement | null>(null);

const fetchCompanyDropdown: CatalogDropdownFetcher = (name, options) =>
  apiFetch<PaginatedResponse<CatalogDropdownRow>>(
    PENDING_INVOICE_COMPANY_DROPDOWN_PATH,
    {
      query: buildPaginatedQuery({ name }, options?.cursor ?? null),
      signal: options?.signal,
    },
  );

const {
  searchTerm,
  items,
  loading,
  loadingMore,
  errorMessage,
  hasNextPage,
  loadNextPage,
} = useCatalogDropdown(fetchCompanyDropdown, { infinite: 'cursor' });

useInfiniteScroll(
  listEl,
  () => {
    if (hasNextPage.value && !loadingMore.value) {
      void loadNextPage();
    }
  },
  { distance: 80 },
);

const selectedIds = computed(
  () => new Set(selectedCompanies.value.map(company => company.id)),
);

const displayItems = computed(() => {
  const list = [...items.value];
  for (const selected of selectedCompanies.value) {
    if (selected.id <= 0) continue;
    if (list.some(row => row.id === selected.id)) continue;
    list.unshift({ id: selected.id, name: selected.name });
  }
  return list;
});

const triggerLabel = computed(() => {
  const count = selectedCompanies.value.length;
  if (count === 0) return 'Filtrar por compañía';
  if (count === 1) return selectedCompanies.value[0]?.name ?? '1 compañía';
  return `${count} compañías`;
});

function isSelected(id: number): boolean {
  return selectedIds.value.has(id);
}

function toggle(row: CatalogDropdownRow, checked: boolean) {
  if (checked) {
    if (isSelected(row.id)) return;
    selectedCompanies.value = [
      ...selectedCompanies.value.filter(company => company.id !== row.id),
      { id: row.id, name: row.name },
    ];
    return;
  }
  selectedCompanies.value = selectedCompanies.value.filter(
    company => company.id !== row.id,
  );
}

function clear() {
  clearCompanies();
}

watch(open, isOpen => {
  if (!isOpen) searchTerm.value = '';
});
</script>

<template>
  <div class="flex items-center gap-1">
    <UPopover
      v-model:open="open"
      :content="{ align: 'end' }"
      :ui="{ content: 'w-72 p-3' }"
    >
      <UButton
        color="neutral"
        :variant="selectedCompanies.length > 0 ? 'subtle' : 'outline'"
        icon="i-lucide-building-2"
        trailing-icon="i-lucide-chevron-down"
        class="max-w-64"
        :ui="{ label: 'truncate' }"
      >
        <span class="truncate">{{ triggerLabel }}</span>
      </UButton>

      <template #content>
        <div class="flex flex-col gap-2">
          <p class="text-xs font-semibold text-highlighted">
            Compañía
          </p>
          <p class="text-[11px] text-dimmed">
            Aplica a los tres tabs a la vez.
          </p>

          <UInput
            v-model="searchTerm"
            icon="i-lucide-search"
            size="sm"
            variant="subtle"
            autofocus
            placeholder="Buscar compañía…"
          />

          <div class="flex items-center justify-between gap-2 text-xs">
            <span class="text-dimmed">
              {{
                selectedCompanies.length === 0
                  ? 'Sin filtro'
                  : `${selectedCompanies.length} seleccionada${selectedCompanies.length === 1 ? '' : 's'}`
              }}
            </span>
            <UButton
              color="neutral"
              variant="link"
              size="xs"
              class="px-0"
              :disabled="selectedCompanies.length === 0"
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
    </UPopover>

    <UButton
      v-if="selectedCompanies.length > 0"
      color="neutral"
      variant="ghost"
      icon="i-lucide-x"
      aria-label="Quitar filtro de compañía"
      @click="clearCompanies"
    />
  </div>
</template>
