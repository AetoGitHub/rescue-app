<script setup lang="ts">
import type { TableColumn, TableRow } from '@nuxt/ui';
import type { Service } from '~/interfaces/catalogs/service';

useHead({
  title: 'Servicios',
});

const slideoverRef = ref<{ openEdit: (id: number) => void | Promise<void> } | null>(null);
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
    accessorKey: 'category_id',
    header: 'Categoría',
  },
];
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <SharedNavbar title="Servicios" />
    </template>
    <template #body>
      <UContainer>
        <div class="flex flex-row justify-between items-center mb-4">
          <div>
            <h1 class="text-3xl font-bold tracking-tight">Servicios</h1>
            <p class="mt-1 text-sm text-muted">
              Gestiona los servicios del catálogo
            </p>
          </div>

          <CatalogServiceCreateSlideover ref="slideoverRef" />
        </div>

        <USeparator />

        <div class="flex flex-row gap-2 my-4">
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
        </div>

        <UTable
          ref="table"
          sticky
          class="h-80"
          :columns="columns"
          :data="rows"
          :loading="isInitialLoading"
          :get-row-id="(row: Service) => String(row.id)"
          @select="onRowSelect"
        />
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
