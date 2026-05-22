<script setup lang="ts">
import type { TableColumn, TableRow } from '@nuxt/ui';
import type { Company } from '~/interfaces/catalogs/company';
import { adminListTableClass } from '~/constants/admin-list-layout';

useHead({
  title: 'Compañías',
});

const slideoverRef = ref<{ openEdit: (id: number) => void | Promise<void> } | null>(null);
const tableRef = useTemplateRef('table');

function onRowSelect(_e: Event, row: TableRow<Company>) {
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
} = useCatalogInfiniteList<Company>({
  key: () => ['companies'],
  path: '/api/catalogue/company/list/',
});

usePaginatedTableInfiniteScroll({
  tableRef,
  hasNextPage,
  loadNextPage,
  asyncStatus,
});

const columns: TableColumn<Company>[] = [
  {
    accessorKey: 'name',
    header: 'Nombre',
  },
  {
    accessorKey: 'business_name',
    header: 'Razón social',
  },
  {
    accessorKey: 'rfc',
    header: 'RFC',
  },
];
</script>

<template>
  <AdminListPageShell
    navbar-title="Compañías"
    title="Compañías"
    description="Gestiona las compañías de tu empresa"
  >
    <template #actions>
      <CatalogCompanyCreateSlideover ref="slideoverRef" />
    </template>

    <template #filters>
      <UInput
        leading-icon="i-lucide-search"
        placeholder="Buscar compañía"
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
      :get-row-id="(row: Company) => String(row.id)"
      @select="onRowSelect"
    />
  </AdminListPageShell>
</template>
