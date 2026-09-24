<script setup lang="ts">
import { useInfiniteQuery, useQuery } from '@pinia/colada';
import { useInfiniteScroll, watchDebounced } from '@vueuse/core';
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

function removeClient(id: number) {
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

const clientSelect = useTemplateRef('clientSelect');

onMounted(() => {
  useInfiniteScroll(
    () => clientSelect.value?.viewportRef,
    () => {
      void loadNextPage();
    },
    {
      canLoadMore: () => hasMore.value && clientsStatus.value !== 'loading',
    },
  );
});
</script>

<template>
  <div class="space-y-3">
    <CatalogDropdownSelect
      v-model="company"
      placeholder="Todas las compañías"
      :fetcher="fetchCompanyDropdown"
      :disabled="disabled"
    />

    <USelectMenu
      ref="clientSelect"
      v-model="selected"
      v-model:search-term="searchTerm"
      multiple
      ignore-filter
      value-key="id"
      label-key="name"
      :items="clients"
      :loading="loadingClients"
      :disabled="disabled"
      :reset-search-term-on-blur="false"
      :reset-search-term-on-select="false"
      :search-input="{ placeholder: 'Buscar cliente…', icon: 'i-lucide-search' }"
      placeholder="Buscar y seleccionar clientes"
      class="w-full"
      variant="subtle"
      :ui="{ base: 'bg-default' }"
    >
      <template #default>
        <span v-if="selected.length === 0" class="truncate text-dimmed">
          Buscar y seleccionar clientes
        </span>
        <span v-else class="truncate">
          {{ selected.length }}
          {{ selected.length === 1 ? 'cliente seleccionado' : 'clientes seleccionados' }}
        </span>
      </template>

      <template #empty>
        <span v-if="clientsError" class="text-error">
          {{ getFetchErrorMessage(clientsError) }}
        </span>
        <span v-else>Sin clientes para este filtro.</span>
      </template>

      <template #content-bottom>
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
          <span v-else class="text-xs text-muted">Desplázate para cargar más</span>
        </div>
      </template>
    </USelectMenu>

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
      <UBadge
        v-if="searchTerm.trim()"
        color="neutral"
        variant="outline"
        class="gap-1"
      >
        <span class="max-w-40 truncate">Búsqueda: {{ searchTerm.trim() }}</span>
        <UButton
          type="button"
          size="xs"
          color="neutral"
          variant="link"
          icon="i-lucide-x"
          class="-me-1 p-0"
          aria-label="Limpiar búsqueda"
          @click="searchTerm = ''"
        />
      </UBadge>
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
            @click="removeClient(id)"
          />
        </UBadge>
      </div>
    </div>
  </div>
</template>
