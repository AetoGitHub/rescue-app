<script setup lang="ts">
import { h, resolveComponent } from 'vue';
import type { TableColumn, TableRow } from '@nuxt/ui';
import type { Client } from '~/interfaces/catalogs/client';
import { adminListTableClass } from '~/constants/admin-list-layout';
import {
  clientCreditUsagePercent,
  clientTypeBadgeProps,
  formatClientMoney,
  isCreditClientType,
  matchesClientTypeFilter,
  type ClientListTypeFilter,
} from '~/utils/client-list-display';

useHead({
  title: 'Clientes',
});

const slideoverRef = ref<{ openEdit: (id: number) => void | Promise<void> } | null>(null);
const tableRef = useTemplateRef('table');
const typeFilter = ref<ClientListTypeFilter>('all');

const UBadge = resolveComponent('UBadge');
const UIcon = resolveComponent('UIcon');

function onRowSelect(_e: Event, row: TableRow<Client>) {
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
} = useCatalogInfiniteList<Client>({
  key: () => ['clients'],
  path: '/api/catalogue/client/list/',
});

usePaginatedTableInfiniteScroll({
  tableRef,
  hasNextPage,
  loadNextPage,
  asyncStatus,
});

const filteredRows = computed(() =>
  rows.value.filter((row) => matchesClientTypeFilter(row.client_type, typeFilter.value)),
);

function setTypeFilter(filter: ClientListTypeFilter) {
  typeFilter.value = filter;
}

const columns: TableColumn<Client>[] = [
  {
    accessorKey: 'name',
    header: 'Nombre',
    cell: ({ row }) =>
      h('div', { class: 'flex items-center gap-1.5' }, [
        h('span', { class: 'font-medium' }, row.original.name),
        h(UIcon, {
          name: 'i-lucide-pencil',
          class: 'size-3.5 shrink-0 text-muted opacity-0 group-hover/tr:opacity-100',
        }),
      ]),
  },
  {
    accessorKey: 'rfc',
    header: 'RFC',
  },
  {
    id: 'phone',
    header: 'Teléfono',
    cell: ({ row }) => row.original.phone?.trim() || '—',
  },
  {
    id: 'client_type',
    header: 'Tipo',
    cell: ({ row }) => {
      const badge = clientTypeBadgeProps(row.original.client_type);
      return h(UBadge, {
        color: badge.color,
        variant: badge.variant,
        size: 'sm',
        label: badge.label,
      });
    },
  },
  {
    id: 'seller',
    header: 'Vendedor',
    cell: ({ row }) => row.original.seller_name?.trim() || '—',
  },
  {
    id: 'credit_limit',
    header: 'Límite',
    cell: ({ row }) => {
      if (!isCreditClientType(row.original.client_type)) return '—';
      return formatClientMoney(row.original.credit_limit);
    },
  },
  {
    id: 'credit_available',
    header: 'Disponible',
    cell: ({ row }) => {
      if (!isCreditClientType(row.original.client_type)) return '—';
      const formatted = formatClientMoney(row.original.credit_available);
      if (formatted === '—') return formatted;
      return h('span', { class: 'font-semibold text-primary' }, formatted);
    },
  },
  {
    id: 'credit_usage',
    header: '% Uso',
    cell: ({ row }) => {
      if (!isCreditClientType(row.original.client_type)) return '—';
      const percent = clientCreditUsagePercent(
        row.original.credit_used,
        row.original.credit_limit,
      );
      return h(resolveComponent('CatalogClientCreditUsageRing'), {
        percent,
        size: 'xs',
      });
    },
  },
  {
    id: 'contract',
    header: 'Contrato',
    cell: ({ row }) => {
      if (row.original.has_contract) {
        return h(UIcon, {
          name: 'i-lucide-file-text',
          class: 'size-5 text-primary',
        });
      }
      return '—';
    },
  },
  {
    id: 'status',
    header: 'Estado',
    cell: ({ row }) =>
      h(UBadge, {
        color: row.original.is_active ? 'success' : 'neutral',
        variant: 'subtle',
        size: 'sm',
        label: row.original.is_active ? 'Activo' : 'Inactivo',
      }),
  },
];
</script>

<template>
  <AdminListPageShell
    navbar-title="Clientes"
    title="Clientes"
    description="Gestiona los clientes de tu empresa"
  >
    <template #actions>
      <CatalogClientCreateSlideover ref="slideoverRef" />
    </template>

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

      <UButton
        label="Todos"
        :variant="typeFilter === 'all' ? 'solid' : 'subtle'"
        :color="typeFilter === 'all' ? 'primary' : 'neutral'"
        @click="setTypeFilter('all')"
      />
      <UButton
        label="Crédito"
        :variant="typeFilter === 'CREDIT' ? 'solid' : 'subtle'"
        :color="typeFilter === 'CREDIT' ? 'primary' : 'neutral'"
        @click="setTypeFilter('CREDIT')"
      />
      <UButton
        label="Contado"
        :variant="typeFilter === 'CASH' ? 'solid' : 'subtle'"
        :color="typeFilter === 'CASH' ? 'primary' : 'neutral'"
        @click="setTypeFilter('CASH')"
      />
      <UButton
        label="Público general"
        :variant="typeFilter === 'PUBLIC' ? 'solid' : 'subtle'"
        :color="typeFilter === 'PUBLIC' ? 'primary' : 'neutral'"
        @click="setTypeFilter('PUBLIC')"
      />
    </template>

    <UTable
      ref="table"
      sticky
      :class="adminListTableClass"
      :columns="columns"
      :data="filteredRows"
      :loading="isInitialLoading"
      :get-row-id="(row: Client) => String(row.id)"
      @select="onRowSelect"
    />
  </AdminListPageShell>
</template>
