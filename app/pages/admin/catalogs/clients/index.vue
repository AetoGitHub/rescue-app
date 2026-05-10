<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui';
import type { Client } from '~/interfaces/catalogs/client';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';

useHead({
  title: 'Clientes',
});

const { data, isPending } = useQuery({
  key: () => ['clients'],
  query: () =>
    $fetch<PaginatedResponse<Client>>(`/api/catalogue/client/list/`),
});

const columns: TableColumn<Client>[] = [
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
  {
    accessorKey: 'client_type',
    header: 'Tipo',
  },
];
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <SharedNavbar title="Clientes" />
    </template>
    <template #body>
      <UContainer>
        <div class="flex flex-row justify-between items-center mb-4">
          <div>
            <h1 class="text-3xl font-bold tracking-tight">Clientes</h1>
            <p class="mt-1 text-sm text-muted">
              Gestiona los clientes de tu empresa
            </p>
          </div>

          <UButton icon="i-lucide-plus" label="Nuevo cliente" size="lg" />
        </div>

        <USeparator />

        <div class="flex flex-row gap-2 my-4">
          <UInput
            leading-icon="i-lucide-search"
            placeholder="Buscar cliente"
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
