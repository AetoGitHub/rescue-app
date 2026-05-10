<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui';
import type { Contract } from '~/interfaces/catalogs/contract';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';

useHead({
  title: 'Contratos',
});

const { data, isPending } = useQuery({
  key: () => ['contracts'],
  query: () =>
    $fetch<PaginatedResponse<Contract>>(`/api/catalogue/contract/list/`),
});

const columns: TableColumn<Contract>[] = [
  {
    accessorKey: 'client_id',
    header: 'Cliente',
  },
  {
    accessorKey: 'notes',
    header: 'Notas',
  },
];
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <SharedNavbar title="Contratos" />
    </template>
    <template #body>
      <UContainer>
        <div class="flex flex-row justify-between items-center mb-4">
          <div>
            <h1 class="text-3xl font-bold tracking-tight">Contratos</h1>
            <p class="mt-1 text-sm text-muted">
              Gestiona los contratos con tus clientes
            </p>
          </div>

          <UButton icon="i-lucide-plus" label="Nuevo contrato" size="lg" />
        </div>

        <USeparator />

        <div class="flex flex-row gap-2 my-4">
          <UInput
            leading-icon="i-lucide-search"
            placeholder="Buscar contrato"
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
