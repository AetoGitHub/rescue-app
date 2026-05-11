<script setup lang="ts">
import type { TableColumn, TableRow } from '@nuxt/ui';
import type { Category } from '~/interfaces/catalogs/category';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';

useHead({
  title: 'Categorías',
});

const slideoverRef = ref<{ openEdit: (id: number) => void | Promise<void> } | null>(null);

function onRowSelect(_e: Event, row: TableRow<Category>) {
  const id = row.original.id;
  if (id != null) {
    void slideoverRef.value?.openEdit(id);
  }
}

const { data, isPending } = useQuery({
  key: () => ['catalog-categories', 'service_category'],
  query: () =>
    $fetch<PaginatedResponse<Category>>(`/api/catalogue/multipurpose/list/`, {
      query: { catalogue_type: 'service_category' },
    }),
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
  <UDashboardPanel>
    <template #header>
      <SharedNavbar title="Categorías" />
    </template>
    <template #body>
      <UContainer>
        <div class="flex flex-row justify-between items-center mb-4">
          <div>
            <h1 class="text-3xl font-bold tracking-tight">Categorías</h1>
            <p class="mt-1 text-sm text-muted">
              Gestiona las categorías de servicio
            </p>
          </div>

          <CatalogCategoryCreateSlideover ref="slideoverRef" />
        </div>

        <USeparator />

        <div class="flex flex-row gap-2 my-4">
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
        </div>

        <UTable
          :columns="columns"
          :data="data?.results"
          :loading="isPending"
          :get-row-id="(row: Category) => String(row.id)"
          @select="onRowSelect"
        />
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
