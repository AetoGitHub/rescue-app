<script setup lang="ts">
import { useInfiniteQuery, useQuery } from '@pinia/colada';
import { watchDebounced } from '@vueuse/core';
import {
  emptyCatalogDropdownSelection,
  type CatalogDropdownRow,
} from '~/interfaces/shared/catalog-dropdown.interface';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';
import {
  buildAllowedClientsQuery,
  hasAllowedClientsFilters,
  mergeAllowedClientIds,
  removeAllowedClientIds,
  type AllowedClientsFilters,
} from '~/utils/allowed-clients';

const props = defineProps<{
  /** Nombres ya conocidos (detalle del usuario) para los chips fuera de la página actual. */
  knownClients?: { id: number; name: string }[];
  disabled?: boolean;
}>();

const selected = defineModel<number[]>({ default: () => [] });

const apiFetch = useApiFetch();
const toast = useToast();

const company = ref(emptyCatalogDropdownSelection());
const searchTerm = ref('');
const debouncedSearch = ref('');

watchDebounced(
  searchTerm,
  (term) => {
    debouncedSearch.value = term;
  },
  { debounce: 300 },
);

const filters = computed<AllowedClientsFilters>(() => ({
  company: company.value.value,
  name: debouncedSearch.value,
}));
const filtersQuery = computed(() => buildAllowedClientsQuery(filters.value));

function fetchCompanyDropdown(name: string, options?: { signal?: AbortSignal }) {
  return apiFetch<PaginatedResponse<CatalogDropdownRow>>(
    '/api/catalogue/company/dropdown/',
    { query: { name }, signal: options?.signal },
  );
}

const {
  data: clientPages,
  asyncStatus: clientsStatus,
  hasNextPage,
  loadNextPage,
  error: clientsError,
} = useInfiniteQuery<PaginatedResponse<CatalogDropdownRow>, Error, string | null>({
  key: () => ['allowed-clients-picker', 'list', filtersQuery.value],
  initialPageParam: null,
  query: ({ pageParam, signal }) =>
    apiFetch<PaginatedResponse<CatalogDropdownRow>>(
      '/api/catalogue/client/dropdown/',
      {
        query: buildPaginatedQuery(filtersQuery.value, pageParam),
        signal,
      },
    ),
  getNextPageParam: getNextCursorPageParam,
});

const clients = computed(() => flattenPaginatedPages(clientPages.value?.pages));
const loadingClients = computed(
  () => clientsStatus.value === 'loading' && clients.value.length === 0,
);
const loadingMore = computed(
  () => clientsStatus.value === 'loading' && clients.value.length > 0,
);
const hasMore = computed(() => Boolean(hasNextPage.value));

const { data: idsData, refetch: refetchIds } = useQuery({
  key: () => ['allowed-clients-picker', 'ids', filtersQuery.value],
  query: ({ signal }) =>
    apiFetch<{ count: number; ids: number[] }>('/api/catalogue/client/ids/', {
      query: filtersQuery.value,
      signal,
    }),
  refetchOnWindowFocus: false,
});

const matchingCount = computed(() => idsData.value?.count ?? null);

/** Nombres vistos en la lista o precargados; los chips los usan aunque cambie el filtro. */
const namesById = ref(new Map<number, string>());

watch(
  () => props.knownClients,
  (rows) => {
    for (const row of rows ?? []) {
      if (row.name) namesById.value.set(row.id, row.name);
    }
  },
  { immediate: true },
);

watch(clients, (rows) => {
  for (const row of rows) namesById.value.set(row.id, row.name);
});

const selectedSet = computed(() => new Set(selected.value));

function toggleClient(id: number, checked: boolean | 'indeterminate') {
  if (checked === true) {
    if (!selectedSet.value.has(id)) selected.value = [...selected.value, id];
    return;
  }
  selected.value = selected.value.filter((value) => value !== id);
}

function clientLabel(id: number) {
  return namesById.value.get(id) || `Cliente #${id}`;
}

const bulkPending = ref(false);

/** "Seleccionar todo" es una foto del momento: siempre pide los ids actuales. */
async function fetchMatchingIds(): Promise<number[] | null> {
  const result = await refetchIds();
  if (result.status === 'error') {
    toast.add({
      title: 'No se pudieron obtener los clientes',
      description: getFetchErrorMessage(result.error),
      color: 'error',
    });
    return null;
  }
  return result.data?.ids ?? [];
}

async function selectAll() {
  if (bulkPending.value) return;
  bulkPending.value = true;
  try {
    const ids = await fetchMatchingIds();
    if (ids) selected.value = mergeAllowedClientIds(selected.value, ids);
  } finally {
    bulkPending.value = false;
  }
}

async function removeAll() {
  if (bulkPending.value) return;
  if (!hasAllowedClientsFilters(filters.value)) {
    selected.value = [];
    return;
  }
  bulkPending.value = true;
  try {
    const ids = await fetchMatchingIds();
    if (ids) selected.value = removeAllowedClientIds(selected.value, ids);
  } finally {
    bulkPending.value = false;
  }
}

const listRef = useTemplateRef<HTMLElement>('listRef');

useScrollContainerInfiniteLoad({
  containerRef: listRef,
  hasNextPage: hasMore,
  loadNextPage,
  asyncStatus: clientsStatus,
});
</script>

<template>
  <div class="space-y-3">
    <div class="grid gap-2 sm:grid-cols-2">
      <CatalogDropdownSelect
        v-model="company"
        placeholder="Todas las compañías"
        :fetcher="fetchCompanyDropdown"
        :disabled="disabled"
      />
      <UInput
        v-model="searchTerm"
        icon="i-lucide-search"
        placeholder="Buscar cliente"
        class="w-full"
        :disabled="disabled"
      />
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <UButton
        type="button"
        size="sm"
        variant="subtle"
        icon="i-lucide-check-check"
        :label="
          matchingCount != null
            ? `Seleccionar todo (${matchingCount})`
            : 'Seleccionar todo'
        "
        :loading="bulkPending"
        :disabled="disabled || bulkPending || matchingCount === 0"
        @click="selectAll"
      />
      <UButton
        type="button"
        size="sm"
        color="neutral"
        variant="subtle"
        icon="i-lucide-x"
        label="Quitar todo"
        :disabled="disabled || bulkPending || selected.length === 0"
        @click="removeAll"
      />
    </div>

    <div
      ref="listRef"
      class="max-h-64 overflow-y-auto rounded-md border border-default"
    >
      <div v-if="loadingClients" class="flex justify-center py-6">
        <UIcon name="i-lucide-loader-circle" class="size-5 animate-spin text-muted" />
      </div>
      <p
        v-else-if="clientsError"
        class="px-3 py-4 text-sm text-error"
        role="alert"
      >
        {{ getFetchErrorMessage(clientsError) }}
      </p>
      <p v-else-if="clients.length === 0" class="px-3 py-4 text-sm text-muted">
        Sin clientes para este filtro.
      </p>
      <ul v-else class="divide-y divide-default">
        <li v-for="client in clients" :key="client.id" class="px-3 py-2">
          <UCheckbox
            :model-value="selectedSet.has(client.id)"
            :label="client.name"
            :disabled="disabled"
            @update:model-value="(v) => toggleClient(client.id, v)"
          />
        </li>
      </ul>
      <div
        v-if="loadingMore || hasMore"
        class="flex min-h-8 items-center justify-center px-2 py-1"
      >
        <UIcon
          v-if="loadingMore"
          name="i-lucide-loader-circle"
          class="size-4 animate-spin text-muted"
          aria-hidden="true"
        />
        <UButton
          v-else
          type="button"
          size="xs"
          variant="link"
          color="neutral"
          label="Ver más"
          @click="loadNextPage()"
        />
      </div>
    </div>

    <div class="space-y-2">
      <p class="text-sm font-medium text-highlighted">
        Seleccionados: {{ selected.length }}
      </p>
      <div
        v-if="selected.length > 0"
        class="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto"
      >
        <UBadge
          v-for="id in selected"
          :key="id"
          color="neutral"
          variant="subtle"
          class="gap-1"
        >
          <span class="max-w-56 truncate">{{ clientLabel(id) }}</span>
          <UButton
            type="button"
            size="xs"
            color="neutral"
            variant="link"
            icon="i-lucide-x"
            class="-me-1 p-0"
            :aria-label="`Quitar ${clientLabel(id)}`"
            :disabled="disabled"
            @click="toggleClient(id, false)"
          />
        </UBadge>
      </div>
    </div>
  </div>
</template>
