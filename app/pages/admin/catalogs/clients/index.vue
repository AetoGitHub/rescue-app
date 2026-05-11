<script setup lang="ts">
import type { TableColumn, TableRow } from '@nuxt/ui';
import type { Client } from '~/interfaces/catalogs/client';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';

useHead({
  title: 'Clientes',
});

const slideoverRef = ref<{ openEdit: (id: number) => void | Promise<void> } | null>(null);

function onRowSelect(_e: Event, row: TableRow<Client>) {
  const id = row.original.id;
  if (id != null) {
    void slideoverRef.value?.openEdit(id);
  }
}

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

          <CatalogClientCreateSlideover ref="slideoverRef" />
        </div>

        <USeparator />

        <div class="flex flex-row gap-2 my-4">
          <UInput
            leading-icon="i-lucide-search"
            placeholder="Buscar cliente"
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
          :get-row-id="(row: Client) => String(row.id)"
          @select="onRowSelect"
        />
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
