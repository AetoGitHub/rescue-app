<script setup lang="ts">
import type { TableColumn, TableRow } from '@nuxt/ui';
import type { Service } from '~/interfaces/catalogs/service';
import { adminListTableClass } from '~/constants/admin-list-layout';

useHead({
  title: 'Servicios',
});

const slideoverRef = ref<{ openEdit: (id: number) => void | Promise<void> } | null>(null);
const categoriesOpen = ref(false);
const tableRef = useTemplateRef('table');

function onRowSelect(_e: Event, row: TableRow<Service>) {
  const id = row.original.id;
  if (id != null) {
    void slideoverRef.value?.openEdit(id);
  }
}

const {
  rows,
  asyncStatus,
  hasNextPage,
  loadNextPage,
  isInitialLoading,
} = useCatalogInfiniteList<Service>({
  key: () => ['services'],
  path: '/api/catalogue/service/list/',
});

usePaginatedTableInfiniteScroll({
  tableRef,
  hasNextPage,
  loadNextPage,
  asyncStatus,
});

const columns: TableColumn<Service>[] = [
  {
    accessorKey: 'name',
    header: 'Nombre',
  },
  {
    accessorKey: 'unit',
    header: 'Unidad',
  },
  {
    accessorKey: 'warranty',
    header: 'Garantía',
  },
  {
    accessorKey: 'category_name',
    header: 'Categoría',
  },
];
</script>

<template>
  <AdminListPageShell
    navbar-title="Servicios"
    title="Servicios"
    description="Gestiona los servicios del catálogo"
  >
    <template #actions>
      <UButton
        icon="i-lucide-folder-tree"
        label="Categorías"
        color="neutral"
        variant="subtle"
        @click="() => { categoriesOpen = true }"
      />
      <CatalogServiceCreateSlideover ref="slideoverRef" />
    </template>

    <template #filters>
      <UInput
        leading-icon="i-lucide-search"
        placeholder="Buscar servicio"
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
      :get-row-id="(row: Service) => String(row.id)"
      @select="onRowSelect"
    />
    <CatalogCategoryManageSlideover v-model:open="categoriesOpen" />
  </AdminListPageShell>
</template>
