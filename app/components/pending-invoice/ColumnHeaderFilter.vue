<script setup lang="ts">
import type { PendingInvoiceColumnMeta } from '~/constants/pending-invoice';
import type { PendingInvoiceDropdownFilterId } from '~/constants/pending-invoice-api';
import { PENDING_INVOICE_DROPDOWN_PATHS } from '~/constants/pending-invoice-api';
import type { PendingInvoiceCell } from '~/utils/pending-invoice-aggregate';
import type { CatalogDropdownFetcher } from '~/composables/useCatalogDropdown';
import type { CatalogDropdownRow } from '~/interfaces/shared/catalog-dropdown.interface';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';
import type { PendingInvoiceFilterSelection } from '~/interfaces/invoicing/pending-invoice';

const props = withDefaults(
  defineProps<{
    label: string;
    kind: PendingInvoiceColumnMeta['kind'];
    options: PendingInvoiceCell[];
    selected: string[];
    sortActive: boolean;
    sortDescending: boolean;
    filterable?: boolean;
    align?: 'start' | 'end';
    dropdown?: PendingInvoiceDropdownFilterId;
  }>(),
  {
    filterable: true,
    align: 'start',
    dropdown: undefined,
  },
);

const emit = defineEmits<{
  'update:selected': [values: string[]];
  sort: [descending: boolean];
}>();

const open = ref(false);
const listRef = useTemplateRef<{ resetSearch: () => void }>('dropdownList');
const apiFetch = useApiFetch();
const { selectionFor, setSelection } = usePendingInvoiceList();

const isDropdown = computed(() => props.dropdown != null);

const dropdownSelected = computed({
  get: (): PendingInvoiceFilterSelection[] =>
    props.dropdown ? selectionFor(props.dropdown) : [],
  set: (values: PendingInvoiceFilterSelection[]) => {
    if (props.dropdown) setSelection(props.dropdown, values);
  },
});

const fetchDropdown: CatalogDropdownFetcher = (name, options) => {
  const path = props.dropdown
    ? PENDING_INVOICE_DROPDOWN_PATHS[props.dropdown]
    : PENDING_INVOICE_DROPDOWN_PATHS.company;
  return apiFetch<PaginatedResponse<CatalogDropdownRow>>(path, {
    query: buildPaginatedQuery({ name }, options?.cursor ?? null),
    signal: options?.signal,
  });
};

const isFiltered = computed(() =>
  isDropdown.value
    ? dropdownSelected.value.length > 0
    : props.selected.length > 0,
);

const sortLabels = computed(() => {
  if (props.kind === 'number' || props.kind === 'money') {
    return { asc: 'Menor a mayor', desc: 'Mayor a menor' };
  }
  if (props.kind === 'date') {
    return { asc: 'Más antiguo primero', desc: 'Más reciente primero' };
  }
  if (props.kind === 'flag') {
    return { asc: 'No primero', desc: 'Sí primero' };
  }
  return { asc: 'Ordenar A → Z', desc: 'Ordenar Z → A' };
});

const sortIcon = computed(() => {
  if (!props.sortActive) return 'i-lucide-arrow-up-down';
  return props.sortDescending
    ? 'i-lucide-arrow-down-wide-narrow'
    : 'i-lucide-arrow-up-narrow-wide';
});

function applySort(descending: boolean) {
  emit('sort', descending);
  open.value = false;
}

watch(open, isOpen => {
  if (!isOpen) listRef.value?.resetSearch();
});
</script>

<template>
  <UPopover
    v-model:open="open"
    :content="{ align, side: 'bottom' }"
    :ui="{ content: 'w-72 p-3' }"
  >
    <button
      type="button"
      class="group flex w-full items-center gap-1.5 text-left text-sheet-header-foreground transition-opacity hover:opacity-80"
      :class="align === 'end' ? 'justify-end' : undefined"
    >
      <span class="truncate">{{ label }}</span>
      <span
        class="flex items-center gap-1"
        :class="align === 'end' ? undefined : 'ms-auto'"
      >
        <UIcon
          :name="sortIcon"
          class="size-3 shrink-0"
          :class="sortActive ? 'opacity-100' : 'opacity-40'"
        />
        <span
          v-if="filterable"
          class="relative flex shrink-0"
        >
          <UIcon
            name="i-lucide-filter"
            class="size-3"
            :class="isFiltered ? 'opacity-100' : 'opacity-40'"
          />
          <span
            v-if="isFiltered"
            class="absolute -end-1 -top-0.5 size-1.5 rounded-full bg-primary ring-1 ring-sheet-header"
          />
        </span>
      </span>
    </button>

    <template #content>
      <div class="flex flex-col gap-2">
        <div class="flex flex-col">
          <UButton
            :icon="kind === 'text' ? 'i-lucide-arrow-down-a-z' : 'i-lucide-arrow-down-0-1'"
            color="neutral"
            variant="ghost"
            size="xs"
            block
            class="justify-start"
            :class="sortActive && !sortDescending ? 'text-primary' : undefined"
            :label="sortLabels.asc"
            @click="applySort(false)"
          />
          <UButton
            :icon="kind === 'text' ? 'i-lucide-arrow-up-a-z' : 'i-lucide-arrow-up-0-1'"
            color="neutral"
            variant="ghost"
            size="xs"
            block
            class="justify-start"
            :class="sortActive && sortDescending ? 'text-primary' : undefined"
            :label="sortLabels.desc"
            @click="applySort(true)"
          />
        </div>

        <template v-if="filterable && isDropdown && dropdown">
          <USeparator />
          <PendingInvoiceDropdownFilterList
            ref="dropdownList"
            v-model:selected="dropdownSelected"
            :fetcher="fetchDropdown"
            :search-placeholder="`Buscar en ${label.toLowerCase()}…`"
          />
        </template>

        <template v-else-if="filterable">
          <USeparator />
          <PendingInvoiceFilterValueList
            :options="options"
            :selected="selected"
            :search-placeholder="`Buscar en ${label.toLowerCase()}…`"
            @update:selected="emit('update:selected', $event)"
          />
        </template>
      </div>
    </template>
  </UPopover>
</template>
