<script setup lang="ts">
import { useMutation, useQueryCache } from '@pinia/colada';
import type { TableColumn } from '@nuxt/ui';
import type { ClientContractRow, Contract } from '~/interfaces/catalogs/contract';
import type { Client } from '~/interfaces/catalogs/client';
import { contractCreateBody } from '~/schemas/catalog-create';
import { adminListTableClass } from '~/constants/admin-list-layout';

useHead({
  title: 'Contratos',
});

const toast = useToast();
const queryCache = useQueryCache();
const creatingClientId = ref<number | null>(null);
const tableRef = useTemplateRef('table');
const UButton = resolveComponent('UButton');

const {
  rows: clientRows,
  asyncStatus: clientsAsyncStatus,
  hasNextPage: clientsHasNextPage,
  loadNextPage: loadNextClientsPage,
  isInitialLoading: clientsInitialLoading,
} = useCatalogInfiniteList<Client>({
  key: () => ['clients'],
  path: '/api/catalogue/client/list/',
});

const {
  rows: contractRows,
  asyncStatus: contractsAsyncStatus,
  hasNextPage: contractsHasNextPage,
  loadNextPage: loadNextContractsPage,
} = useCatalogInfiniteList<Contract>({
  key: () => ['contracts'],
  path: '/api/catalogue/contract/list/',
});

const hasNextPage = computed(
  () => clientsHasNextPage.value || contractsHasNextPage.value,
);

const asyncStatus = computed(() =>
  clientsAsyncStatus.value === 'loading'
  || contractsAsyncStatus.value === 'loading'
    ? 'loading'
    : 'idle',
);

function loadNextPage() {
  if (clientsHasNextPage.value) {
    void loadNextClientsPage();
  }
  if (contractsHasNextPage.value) {
    void loadNextContractsPage();
  }
}

usePaginatedTableInfiniteScroll({
  tableRef,
  hasNextPage,
  loadNextPage,
  asyncStatus,
});

const rows = computed<ClientContractRow[]>(() => {
  const contractsByClientId = new Map(
    contractRows.value.map((contract) => [contract.client_id, contract]),
  );

  return clientRows.value.map((client) => ({
    client,
    contract: contractsByClientId.get(client.id),
  }));
});

const isInitialLoading = computed(() => clientsInitialLoading.value);

function resolveContractId(payload: unknown): number | null {
  if (payload == null || typeof payload !== 'object') return null;
  const record = payload as Record<string, unknown>;
  const id = record.id;
  return typeof id === 'number' ? id : null;
}

const { mutate: createContract } = useMutation({
  mutation: (clientId: number) =>
    $fetch<Record<string, unknown>>('/api/catalogue/contract/create/', {
      method: 'POST',
      body: contractCreateBody(clientId),
    }),
  async onSuccess(payload) {
    toast.add({
      title: 'Contrato creado',
      color: 'success',
    });
    await queryCache.invalidateQueries({ key: ['contracts'] });
    await queryCache.invalidateQueries({ key: ['clients'] });
    const contractId = resolveContractId(payload);
    if (contractId != null) {
      await navigateTo(`/admin/catalogs/contracts/${contractId}`);
    }
  },
  onError: (e) => {
    console.error(e);
    toast.add({
      title: 'No se pudo crear el contrato',
      description: getFetchErrorMessage(e),
      color: 'error',
    });
  },
  onSettled: () => {
    creatingClientId.value = null;
  },
});

function manageContract(contractId: number) {
  void navigateTo(`/admin/catalogs/contracts/${contractId}`);
}

function createContractForClient(clientId: number) {
  creatingClientId.value = clientId;
  createContract(clientId);
}

const columns: TableColumn<ClientContractRow>[] = [
  {
    accessorKey: 'client.name',
    header: 'Nombre',
    cell: ({ row }) => row.original.client.name,
  },
  {
    accessorKey: 'client.business_name',
    header: 'Razón social',
    cell: ({ row }) => row.original.client.business_name,
  },
  {
    accessorKey: 'client.rfc',
    header: 'RFC',
    cell: ({ row }) => row.original.client.rfc,
  },
  {
    accessorKey: 'client.client_type',
    header: 'Tipo',
    cell: ({ row }) => row.original.client.client_type,
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => {
      const { client, contract } = row.original;
      if (contract != null) {
        return h(UButton, {
          label: 'Gestionar contrato',
          size: 'sm',
          variant: 'subtle',
          onClick: () => manageContract(contract.id),
        });
      }

      return h(UButton, {
        label: 'Crear contrato',
        size: 'sm',
        variant: 'subtle',
        loading: creatingClientId.value === client.id,
        disabled: creatingClientId.value === client.id,
        onClick: () => createContractForClient(client.id),
      });
    },
  },
];
</script>

<template>
  <AdminListPageShell
    navbar-title="Contratos"
    title="Contratos"
    description="Asigna y gestiona contratos por cliente"
  >
    <template #filters>
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
      <UButton label="Con contrato" variant="subtle" color="neutral" />
      <UButton label="Sin contracto" variant="subtle" color="neutral" />
    </template>

    <UTable
      ref="table"
      sticky
      :class="adminListTableClass"
      :columns="columns"
      :data="rows"
      :loading="isInitialLoading"
      :get-row-id="(row: ClientContractRow) => String(row.client.id)"
    />
  </AdminListPageShell>
</template>
