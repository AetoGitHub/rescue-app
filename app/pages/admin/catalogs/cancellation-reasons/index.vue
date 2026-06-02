<script setup lang="ts">
import type { TableColumn, TableRow } from '@nuxt/ui';
import type { Category } from '~/interfaces/catalogs/category';
import { adminListTableClass } from '~/constants/admin-list-layout';

useHead({
  title: 'Cancelación',
});

const slideoverRef = ref<{ openEdit: (id: number, name: string) => void } | null>(null);
const reacceptanceOpen = ref(false);
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
  key: () => ['catalog-multipurpose', 'cancellation_reason'],
  path: '/api/catalogue/multipurpose/list/',
  query: { type: 'cancellation_reason' },
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
    navbar-title="Cancelación"
    title="Motivos de cancelación"
    description="Gestiona los motivos usados al cancelar un rescate"
  >
    <template #actions>
      <UButton
        icon="i-lucide-rotate-ccw"
        label="Re-aceptación"
        color="neutral"
        variant="subtle"
        @click="reacceptanceOpen = true"
      />
      <CatalogCategoryCreateSlideover
        ref="slideoverRef"
        catalogue-type="cancellation_reason"
        create-title="Nuevo motivo de cancelación"
        edit-title="Editar motivo de cancelación"
        new-item-label="Nuevo motivo"
        success-create-label="Motivo de cancelación creado"
        success-edit-label="Motivo de cancelación actualizado"
        name-placeholder="Ej. Cliente no autorizó"
      />
    </template>

    <template #filters>
      <UInput
        leading-icon="i-lucide-search"
        placeholder="Buscar motivo"
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

    <CatalogCategoryManageSlideover
      v-model:open="reacceptanceOpen"
      catalogue-type="reacceptance_reason"
      title="Razones de re-aceptación"
      description="Gestiona los motivos para revertir una cancelación."
      search-placeholder="Buscar motivo de re-aceptación"
      new-item-label="Nuevo motivo"
      create-title="Nuevo motivo de re-aceptación"
      edit-title="Editar motivo de re-aceptación"
      success-create-label="Motivo de re-aceptación creado"
      success-edit-label="Motivo de re-aceptación actualizado"
      name-placeholder="Ej. Error operativo"
    />
  </AdminListPageShell>
</template>
