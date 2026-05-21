<script setup lang="ts">
import type { TableColumn, TableRow } from '@nuxt/ui';
import type { Category } from '~/interfaces/catalogs/category';

const open = defineModel<boolean>('open', { default: false });

const categoryCrudRef = ref<{
  prepareCreate: () => void;
  openEdit: (id: number, name: string) => void;
} | null>(null);

const tableRef = useTemplateRef('table');
const search = ref('');

function onRowSelect(_e: Event, row: TableRow<Category>) {
  const { id, name } = row.original;
  if (id != null) {
    categoryCrudRef.value?.openEdit(id, name);
  }
}

const {
  rows,
  asyncStatus,
  hasNextPage,
  loadNextPage,
  isInitialLoading,
} = useCatalogInfiniteList<Category>({
  key: () => ['catalog-categories', 'service_category'],
  path: '/api/catalogue/multipurpose/list/',
  query: { catalogue_type: 'service_category' },
});

usePaginatedTableInfiniteScroll({
  tableRef,
  hasNextPage,
  loadNextPage,
  asyncStatus,
});

const filteredRows = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return rows.value;
  return rows.value.filter((row) => row.name.toLowerCase().includes(q));
});

const columns: TableColumn<Category>[] = [
  { accessorKey: 'name', header: 'Nombre' },
  { accessorKey: 'catalogue_type', header: 'Tipo de catálogo' },
];
</script>

<template>
  <USlideover
    v-model:open="open"
    title="Categorías de servicio"
    description="Gestiona las categorías usadas al registrar servicios."
    :ui="{ content: 'max-w-2xl' }"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <div class="flex flex-wrap items-center gap-2">
          <UInput
            v-model="search"
            leading-icon="i-lucide-search"
            placeholder="Buscar categoría"
            class="min-w-0 flex-1"
            variant="subtle"
          />
          <UButton
            icon="i-lucide-plus"
            label="Nueva categoría"
            @click="categoryCrudRef?.prepareCreate()"
          />
        </div>

        <UTable
          ref="table"
          sticky
          class="h-[min(24rem,50vh)]"
          :columns="columns"
          :data="filteredRows"
          :loading="isInitialLoading"
          :get-row-id="(row: Category) => String(row.id)"
          @select="onRowSelect"
        />
      </div>

      <CatalogCategoryCreateSlideover
        ref="categoryCrudRef"
        :show-trigger="false"
      />
    </template>
  </USlideover>
</template>
