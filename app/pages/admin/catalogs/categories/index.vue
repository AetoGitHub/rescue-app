<script setup lang="ts">
import type { TableColumn, TableRow } from '@nuxt/ui';
import type { Category } from '~/interfaces/catalogs/category';
import { adminListTableClass } from '~/constants/admin-list-layout';

useHead({
  title: 'Categorías',
});

const slideoverRef = ref<{ openEdit: (id: number, name: string) => void } | null>(null);
const tableRef = useTemplateRef('table');

function onRowSelect(_e: Event, row: TableRow<Category>) {
  const { id, name } = row.original;
  if (id != null) {
    slideoverRef.value?.openEdit(id, name);
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

const columns: TableColumn<Category>[] = [
  {
    accessorKey: 'name',
    header: 'Nombre',
  },
  {
    accessorKey: 'catalogue_type',
    header: 'Tipo de catálogo',
  },
];
</script>

<template>
  <AdminListPageShell
    navbar-title="Categorías"
    title="Categorías"
    description="Gestiona las categorías de servicio"
  >
    <template #actions>
      <CatalogCategoryCreateSlideover ref="slideoverRef" />
    </template>

    <template #filters>
      <UInput
        leading-icon="i-lucide-search"
        placeholder="Buscar categoría"
        class="flex-1"
        variant="subtle"
        :ui="{
          base: 'bg-default',
        }"
      />

      <UButton label="Todos" variant="subtle" color="primary" />
      <UButton label="Activos" variant="subtle" color="neutral" />
      <UButton label="Inactivos" variant="subtle" color="neutral" />
    </template>

    <UTable
      ref="table"
      sticky
      :class="adminListTableClass"
      :columns="columns"
      :data="rows"
      :loading="isInitialLoading"
      :get-row-id="(row: Category) => String(row.id)"
      @select="onRowSelect"
    />
  </AdminListPageShell>
</template>
