<script setup lang="ts">
import type { TableColumn, TableRow } from '@nuxt/ui';
import type { Company } from '~/interfaces/catalogs/company';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';

useHead({
  title: 'Compañías',
});

const slideoverRef = ref<{ openEdit: (id: number) => void | Promise<void> } | null>(null);

function onRowSelect(_e: Event, row: TableRow<Company>) {
  const id = row.original.id;
  if (id != null) {
    void slideoverRef.value?.openEdit(id);
  }
}

const { data, isPending } = useQuery({
  key: () => ['companies'],
  query: () =>
    $fetch<PaginatedResponse<Company>>(`/api/catalogue/company/list/`),
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
  <UDashboardPanel>
    <template #header>
      <SharedNavbar title="Compañías" />
    </template>
    <template #body>
      <UContainer>
        <div class="flex flex-row justify-between items-center mb-4">
          <div>
            <h1 class="text-3xl font-bold tracking-tight">Compañías</h1>
            <p class="mt-1 text-sm text-muted">
              Gestiona las compañías de tu empresa
            </p>
          </div>

          <CatalogCompanyCreateSlideover ref="slideoverRef" />
        </div>

        <USeparator />

        <div class="flex flex-row gap-2 my-4">
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
        </div>

        <UTable
          :columns="columns"
          :data="data?.results"
          :loading="isPending"
          :get-row-id="(row: Company) => String(row.id)"
          @select="onRowSelect"
        />
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
