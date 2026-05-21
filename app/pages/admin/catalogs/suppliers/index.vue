<script setup lang="ts">
import { h, resolveComponent } from 'vue';
import type { TableColumn, TableRow } from '@nuxt/ui';
import type { Supplier, SupplierServiceType } from '~/interfaces/catalogs/supplier';
import { SUPPLIER_SERVICE_TYPE_OPTIONS } from '~/constants/catalog-select-options';

useHead({
  title: 'Proveedores',
});

const UBadge = resolveComponent('UBadge');

const modalRef = ref<{
  openEdit: (id: number) => void | Promise<void>;
} | null>(null);
const tableRef = useTemplateRef('table');

const viewMode = ref<'list' | 'map'>('list');
const search = ref('');
const trustedOnly = ref(false);
const serviceTypeFilter = ref<SupplierServiceType | 'all'>('all');

function onRowSelect(_e: Event, row: TableRow<Supplier>) {
  const id = row.original.id;
  if (id != null) {
    void modalRef.value?.openEdit(id);
  }
}

function openSupplier(id: number) {
  void modalRef.value?.openEdit(id);
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

const serviceTypeFilterItems = [
  { label: 'Todos los tipos', value: 'all' as const },
  ...SUPPLIER_SERVICE_TYPE_OPTIONS,
];

const filteredRows = computed(() => {
  const q = search.value.trim().toLowerCase();
  return rows.value.filter((row) => {
    if (trustedOnly.value && !row.is_trusted) return false;
    if (
      serviceTypeFilter.value !== 'all' &&
      row.service_type !== serviceTypeFilter.value
    ) {
      return false;
    }
    if (!q) return true;
    return (
      row.name.toLowerCase().includes(q) ||
      row.phone.toLowerCase().includes(q) ||
      (serviceTypeLabel[row.service_type] ?? row.service_type)
        .toLowerCase()
        .includes(q)
    );
  });
});

const columns: TableColumn<Supplier>[] = [
  {
    accessorKey: 'name',
    header: 'Nombre',
    cell: ({ row }) => {
      const children = [h('span', { class: 'font-medium' }, row.original.name)];
      if (row.original.is_trusted) {
        children.push(
          h(
            UBadge,
            {
              color: 'warning',
              variant: 'subtle',
              size: 'xs',
              class: 'ms-2 shrink-0',
              leadingIcon: 'i-lucide-star',
              label: 'Confianza',
            },
          ),
        );
      }
      return h('div', { class: 'flex flex-wrap items-center gap-1' }, children);
    },
  },
  {
    id: 'ranking',
    header: 'Ranking',
    cell: ({ row }) =>
      h(resolveComponent('CatalogSupplierRankingDisplay'), {
        score: row.original.score,
        size: 'xs',
      }),
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
    accessorKey: 'is_active',
    header: 'Estado',
    cell: ({ row }) => (row.original.is_active ? 'Activo' : 'Inactivo'),
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
        <div class="flex flex-row flex-wrap justify-between items-center gap-3 mb-4">
          <div>
            <h1 class="text-3xl font-bold tracking-tight">Proveedores</h1>
            <p class="mt-1 text-sm text-muted">
              Gestiona los proveedores de servicios
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <UFieldGroup>
              <UButton
                :color="viewMode === 'list' ? 'primary' : 'neutral'"
                icon="i-lucide-list"
                variant="solid"
                aria-label="Vista lista"
                @click="viewMode = 'list'"
              />
              <UButton
                :color="viewMode === 'map' ? 'primary' : 'neutral'"
                icon="i-lucide-map"
                variant="subtle"
                aria-label="Vista mapa"
                @click="viewMode = 'map'"
              />
            </UFieldGroup>
            <CatalogSupplierCreateModal ref="modalRef" />
          </div>
        </div>

        <USeparator />

        <div class="flex flex-row flex-wrap gap-2 my-4">
          <UInput
            v-model="search"
            leading-icon="i-lucide-search"
            placeholder="Buscar proveedor"
            class="min-w-0 flex-1"
            variant="subtle"
            :ui="{
              base: 'bg-default',
            }"
          />

          <UButton
            :color="trustedOnly ? 'warning' : 'neutral'"
            label="Solo confianza"
            leading-icon="i-lucide-star"
            :variant="trustedOnly ? 'solid' : 'subtle'"
            @click="trustedOnly = !trustedOnly"
          />

          <USelectMenu
            v-model="serviceTypeFilter"
            :items="serviceTypeFilterItems"
            value-key="value"
            label-key="label"
            class="min-w-48"
            variant="subtle"
          />
        </div>

        <UTable
          v-if="viewMode === 'list'"
          ref="table"
          sticky
          class="h-80"
          :columns="columns"
          :data="filteredRows"
          :loading="isInitialLoading"
          :get-row-id="(row: Supplier) => String(row.id)"
          @select="onRowSelect"
        />

        <CatalogSuppliersMapView
          v-else
          :suppliers="filteredRows"
          @select="openSupplier"
        />
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
