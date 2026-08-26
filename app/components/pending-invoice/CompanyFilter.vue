<script setup lang="ts">
import type { CatalogDropdownFetcher } from '~/composables/useCatalogDropdown';
import {
  PENDING_INVOICE_COMPANIES_DROPDOWN_PATH,
} from '~/constants/pending-invoice-api';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';
import type { CatalogDropdownRow } from '~/interfaces/shared/catalog-dropdown.interface';

const { selectedCompanies, clearCompanies } = usePendingInvoiceList();
const apiFetch = useApiFetch();

const open = ref(false);
const listRef = useTemplateRef<{ resetSearch: () => void }>('list');

const fetchCompanyDropdown: CatalogDropdownFetcher = (name, options) =>
  apiFetch<PaginatedResponse<CatalogDropdownRow>>(
    PENDING_INVOICE_COMPANIES_DROPDOWN_PATH,
    {
      query: buildPaginatedQuery({ name }, options?.cursor ?? null),
      signal: options?.signal,
    },
  );

const triggerLabel = computed(() => {
  const count = selectedCompanies.value.length;
  if (count === 0) return 'Filtrar por compañía';
  if (count === 1) return selectedCompanies.value[0]?.name ?? '1 compañía';
  return `${count} compañías`;
});

watch(open, isOpen => {
  if (!isOpen) listRef.value?.resetSearch();
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

          <PendingInvoiceDropdownFilterList
            ref="list"
            v-model:selected="selectedCompanies"
            :fetcher="fetchCompanyDropdown"
            search-placeholder="Buscar compañía…"
          />
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
