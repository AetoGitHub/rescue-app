<script setup lang="ts">
import type { TableColumn, TableRow } from '@nuxt/ui';
import type { Supplier } from '~/interfaces/catalogs/supplier';
import { SUPPLIER_SERVICE_TYPE_OPTIONS } from '~/constants/catalog-select-options';

useHead({
  title: 'Proveedores',
});

const modalRef = ref<{
  openEdit: (id: number) => void | Promise<void>;
} | null>(null);
const tableRef = useTemplateRef('table');

function onRowSelect(_e: Event, row: TableRow<Supplier>) {
  const id = row.original.id;
  if (id != null) {
    void modalRef.value?.openEdit(id);
  }
}

const {
  rows,
  asyncStatus,
  hasNextPage,
  loadNextPage,
  isInitialLoading,
} = useCatalogInfiniteList<Supplier>({
  key: () => ['suppliers'],
  path: '/api/supplier/list/',
});

usePaginatedTableInfiniteScroll({
  tableRef,
  hasNextPage,
  loadNextPage,
  asyncStatus,
});

const serviceTypeLabel: Record<string, string> = Object.fromEntries(
  SUPPLIER_SERVICE_TYPE_OPTIONS.map((o) => [o.value, o.label]),
);

const columns: TableColumn<Supplier>[] = [
  {
    accessorKey: 'name',
    header: 'Nombre',
  },
  {
    accessorKey: 'service_type',
    header: 'Tipo de servicio',
    cell: ({ row }) =>
      serviceTypeLabel[row.original.service_type] ?? row.original.service_type,
  },
  {
    accessorKey: 'phone',
    header: 'Teléfono',
  },
  {
    accessorKey: 'is_trusted',
    header: 'Confiable',
    cell: ({ row }) => (row.original.is_trusted ? 'Sí' : 'No'),
  },
];
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <SharedNavbar title="Proveedores" />
    </template>
    <template #body>
      <UContainer>
        <div class="flex flex-row justify-between items-center mb-4">
          <div>
            <h1 class="text-3xl font-bold tracking-tight">Proveedores</h1>
            <p class="mt-1 text-sm text-muted">
              Gestiona los proveedores de servicios
            </p>
          </div>

          <CatalogSupplierCreateModal ref="modalRef" />
        </div>

        <USeparator />

        <div class="flex flex-row gap-2 my-4">
          <UInput
            leading-icon="i-lucide-search"
            placeholder="Buscar proveedor"
            class="flex-1"
            variant="subtle"
            :ui="{
              base: 'bg-default',
            }"
          />

          <UButton
            label="Solo confianza"
            leading-icon="i-lucide-star"
            variant="subtle"
            color="neutral"
          />

          <USelect
            :items="['all', 'auxilio_vial', 'crane', 'mechanic']"
            default-value="all"
            placeholder="Tipo de servicio"
            class="min-w-48"
          />
        </div>

        <UTable
          ref="table"
          sticky
          class="h-80"
          :columns="columns"
          :data="rows"
          :loading="isInitialLoading"
          :get-row-id="(row: Supplier) => String(row.id)"
          @select="onRowSelect"
        />
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
