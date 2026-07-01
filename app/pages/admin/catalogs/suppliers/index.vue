<script setup lang="ts">
import { h, resolveComponent } from 'vue';
import type { TableColumn, TableRow } from '@nuxt/ui';
import type { Supplier, SupplierServiceType } from '~/interfaces/catalogs/supplier';
import type { MapViewport } from '~/utils/map-viewport';
import { SUPPLIER_SERVICE_TYPE_OPTIONS } from '~/constants/catalog-select-options';
import {
  adminCatalogMapPanelClass,
  adminListTableClass,
} from '~/constants/admin-list-layout';

useHead({
  title: 'Proveedores',
});

const UBadge = resolveComponent('UBadge');

type SupplierViewMode = 'list' | 'map';

const SUPPLIER_VIEW_TAB_ITEMS = [
  { label: 'Lista', value: 'list' as const, icon: 'i-lucide-list', slot: 'list' as const },
  { label: 'Mapa', value: 'map' as const, icon: 'i-lucide-map', slot: 'map' as const },
];

const slideoverRef = ref<{
  openEdit: (id: number) => void | Promise<void>;
} | null>(null);
const tableRef = useTemplateRef('table');

const viewMode = ref<SupplierViewMode>('list');
const search = ref('');
const trustedOnly = ref(false);
const serviceTypeFilter = ref<SupplierServiceType | 'all'>('all');
const mapViewLayoutKey = ref(0);

const { queryParams, displayQueryParams, setViewport } = useSupplierMapViewport();

const mapListEnabled = computed(() => viewMode.value === 'map');

const {
  suppliers: mapSuppliers,
  loading: mapLoading,
  errorMessage: mapErrorMessage,
} = useSupplierMapList({
  fetchViewport: queryParams,
  displayViewport: displayQueryParams,
  search,
  trustedOnly,
  serviceTypeFilter,
  enabled: mapListEnabled,
});

function toggleTrustedOnly() {
  trustedOnly.value = !trustedOnly.value;
}

function onRowSelect(_e: Event, row: TableRow<Supplier>) {
  const id = row.original.id;
  if (id != null) {
    void slideoverRef.value?.openEdit(id);
  }
}

function openSupplier(id: number) {
  void slideoverRef.value?.openEdit(id);
}

function onMapViewportChange(viewport: MapViewport) {
  setViewport(viewport);
}

const {
  rows: rawRows,
  asyncStatus,
  hasNextPage,
  loadNextPage,
  isInitialLoading,
} = useCatalogInfiniteList<Record<string, unknown>>({
  key: () => ['suppliers'],
  path: '/api/supplier/list/',
});

const rows = computed(() => rawRows.value.map(mapSupplierListRow));

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
      !row.service_type.includes(serviceTypeFilter.value)
    ) {
      return false;
    }
    if (!q) return true;
    const typeLabels = row.service_type
      .map((t) => serviceTypeLabel[t] ?? t)
      .join(' ')
      .toLowerCase();
    return (
      row.name.toLowerCase().includes(q) ||
      row.phone.toLowerCase().includes(q) ||
      typeLabels.includes(q)
    );
  });
});

watch(viewMode, (mode) => {
  if (mode === 'map') {
    mapViewLayoutKey.value += 1;
  }
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
              size: 'sm',
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
    accessorKey: 'rescues_count',
    header: 'Rescates',
    cell: ({ row }) => String(row.original.rescues_count ?? 0),
  },
  {
    id: 'service_type',
    header: 'Tipo de servicio',
    cell: ({ row }) => {
      const badges = row.original.service_type.map((type) =>
        h(UBadge, {
          color: 'neutral',
          variant: 'subtle',
          size: 'xs',
          label: serviceTypeLabel[type] ?? type,
          class: 'shrink-0',
        }),
      );
      return h('div', { class: 'flex flex-wrap gap-1' }, badges);
    },
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
  <AdminListPageShell
    navbar-title="Proveedores"
    title="Proveedores"
    description="Gestiona los proveedores de servicios"
  >
    <template #actions>
      <CatalogSupplierCreateSlideover ref="slideoverRef" />
    </template>

    <template #filters>
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
        @click="toggleTrustedOnly"
      />

      <USelectMenu
        v-model="serviceTypeFilter"
        :items="serviceTypeFilterItems"
        value-key="value"
        label-key="label"
        class="min-w-48"
        variant="subtle"
      />
    </template>

    <UTabs
      v-model="viewMode"
      :items="SUPPLIER_VIEW_TAB_ITEMS"
      :unmount-on-hide="false"
      class="flex min-h-0 flex-1 flex-col gap-4"
      :ui="{
        list: 'flex-nowrap overflow-x-auto max-w-full shrink-0',
        trigger: 'shrink-0',
        content: 'flex min-h-0 flex-1 flex-col',
      }"
      variant="link"
    >
      <template #list>
        <UTable
          ref="table"
          sticky
          :class="adminListTableClass"
          :columns="columns"
          :data="filteredRows"
          :loading="isInitialLoading"
          :get-row-id="(row: Supplier) => String(row.id)"
          @select="onRowSelect"
        />
      </template>

      <template #map>
        <div
          v-if="viewMode === 'map'"
          class="relative"
          :class="adminCatalogMapPanelClass"
        >
          <CatalogSuppliersMapView
            :key="mapViewLayoutKey"
            :class="adminCatalogMapPanelClass"
            :layout-key="mapViewLayoutKey"
            :suppliers="mapSuppliers"
            @select="openSupplier"
            @viewport-change="onMapViewportChange"
          />
          <div
            v-if="mapLoading"
            class="pointer-events-none absolute inset-0 z-10 flex items-start justify-center bg-default/40 pt-4"
          >
            <div
              class="flex items-center gap-2 rounded-lg border border-default bg-default/95 px-3 py-2 text-sm text-muted shadow-sm"
            >
              <UIcon
                name="i-lucide-loader-circle"
                class="size-5 animate-spin"
              />
              Cargando proveedores…
            </div>
          </div>
          <p
            v-if="mapErrorMessage"
            class="pointer-events-none absolute inset-x-3 top-3 z-10 rounded-lg border border-error/30 bg-default/95 px-3 py-2 text-xs text-error shadow-sm"
            role="alert"
          >
            {{ mapErrorMessage }}
          </p>
        </div>
      </template>
    </UTabs>
  </AdminListPageShell>
</template>
