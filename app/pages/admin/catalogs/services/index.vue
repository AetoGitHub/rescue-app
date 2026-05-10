<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui';
import type { Service } from '~/interfaces/catalogs/service';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';

useHead({
  title: 'Servicios',
});

const { data, isPending } = useQuery({
  key: () => ['services'],
  query: () =>
    $fetch<PaginatedResponse<Service>>(`/api/catalogue/service/list/`),
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

          <UButton icon="i-lucide-plus" label="Nuevo servicio" size="lg" />
        </div>

        <USeparator />

        <div class="flex flex-row gap-2 my-4">
          <UInput
            leading-icon="i-lucide-search"
            placeholder="Buscar servicio"
            class="flex-1"
            variant="subtle"
          />

          <UButton label="Todos" variant="subtle" color="primary" />
          <UButton label="Activos" variant="subtle" color="neutral" />
          <UButton label="Inactivos" variant="subtle" color="neutral" />
        </div>

        <UTable :columns="columns" :data="data?.results" :loading="isPending" />
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
