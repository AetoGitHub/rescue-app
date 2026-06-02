<script setup lang="ts">
import { h, resolveComponent } from 'vue';
import type { TableColumn, TableRow } from '@nuxt/ui';
import type { AdministrativeRescueCard } from '~/interfaces/rescue/administrative';
import { adminListTableClass } from '~/constants/admin-list-layout';

const props = defineProps<{
  rows: AdministrativeRescueCard[];
  loading?: boolean;
  hasNextPage?: boolean;
  loadNextPage?: () => unknown;
  asyncStatus?: import('@pinia/colada').AsyncStatus;
}>();

const emit = defineEmits<{
  select: [card: AdministrativeRescueCard];
}>();

type SortKey =
  | 'folio'
  | 'sale_price'
  | 'net_profit'
  | 'created_at'
  | 'service_date';

const sortKey = ref<SortKey>('created_at');
const sortDesc = ref(true);
const tableRef = useTemplateRef('table');

const UButton = resolveComponent('UButton');
const UBadge = resolveComponent('UBadge');

function toggleSort(key: SortKey) {
  if (sortKey.value === key) {
    sortDesc.value = !sortDesc.value;
  } else {
    sortKey.value = key;
    sortDesc.value = key !== 'folio';
  }
}

function sortHeader(label: string, key: SortKey) {
  const active = sortKey.value === key;
  return h(
    'button',
    {
      type: 'button',
      class:
        'inline-flex items-center gap-1 font-medium text-highlighted hover:text-primary',
      onClick: () => toggleSort(key),
    },
    [
      label,
      h('span', { class: 'text-xs text-muted' }, active ? (sortDesc.value ? '↓' : '↑') : ''),
    ],
  );
}

function parseSortNumber(value: string | null): number {
  if (value == null || value === '') return 0;
  const parsed = Number(String(value).replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

const sortedRows = computed(() => {
  const copy = [...props.rows];
  const dir = sortDesc.value ? -1 : 1;

  copy.sort((a, b) => {
    switch (sortKey.value) {
      case 'folio':
        return a.folio.localeCompare(b.folio) * dir;
      case 'sale_price':
        return (
          (parseSortNumber(a.sale_price) - parseSortNumber(b.sale_price)) * dir
        );
      case 'net_profit':
        return (
          (parseSortNumber(a.net_profit) - parseSortNumber(b.net_profit)) * dir
        );
      case 'service_date':
        return (
          String(a.service_date ?? '').localeCompare(
            String(b.service_date ?? ''),
          ) * dir
        );
      case 'created_at':
      default:
        return (
          String(a.created_at).localeCompare(String(b.created_at)) * dir
        );
    }
  });

  return copy;
});

function onRowSelect(_e: Event, row: TableRow<AdministrativeRescueCard>) {
  emit('select', row.original);
}

const columns: TableColumn<AdministrativeRescueCard>[] = [
  {
    accessorKey: 'folio',
    header: () => sortHeader('Folio', 'folio'),
    cell: ({ row }) =>
      h('span', { class: 'font-medium' }, row.original.folio),
  },
  {
    id: 'service_type',
    header: 'Tipo',
    cell: ({ row }) => {
      const badge = getRescueServiceTypeBadge(row.original.service_type);
      return h(UBadge, {
        color: badge.color,
        variant: 'subtle',
        size: 'sm',
        label: badge.label,
      });
    },
  },
  {
    accessorKey: 'client_name',
    header: 'Cliente',
  },
  {
    id: 'operator',
    header: 'Gestor',
    cell: ({ row }) => row.original.operator_name?.trim() || '—',
  },
  {
    id: 'supplier',
    header: 'Proveedor',
    cell: ({ row }) => row.original.supplier_name?.trim() || '—',
  },
  {
    id: 'sale_price',
    header: () => sortHeader('Precio venta', 'sale_price'),
    cell: ({ row }) => formatRescueCardMoney(row.original.sale_price),
  },
  {
    id: 'net_profit',
    header: () => sortHeader('Utilidad', 'net_profit'),
    cell: ({ row }) => formatRescueCardMoney(row.original.net_profit),
  },
  {
    id: 'operative_status',
    header: 'Estatus Op.',
    cell: ({ row }) =>
      getAdministrativeOperativeStatusLabel(row.original.operative_status),
  },
  {
    id: 'billing_status',
    header: 'Estatus Admin',
    cell: ({ row }) => {
      const badge = getBillingStatusBadge(row.original.billing_status);
      return h(UBadge, {
        color: badge.color,
        variant: 'subtle',
        size: 'sm',
        label: badge.label,
      });
    },
  },
  {
    id: 'date',
    header: () => sortHeader('Fecha', 'service_date'),
    cell: ({ row }) =>
      row.original.service_date ?? row.original.created_at?.slice(0, 10) ?? '—',
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) =>
      h(UButton, {
        color: 'neutral',
        size: 'xs',
        variant: 'subtle',
        label: 'Ver',
        onClick: (e: Event) => {
          e.stopPropagation();
          emit('select', row.original);
        },
      }),
  },
];

const hasNextPageRef = computed(() => props.hasNextPage ?? false);
const asyncStatusRef = computed(
  () => props.asyncStatus ?? ('idle' as import('@pinia/colada').AsyncStatus),
);

usePaginatedTableInfiniteScroll({
  tableRef,
  hasNextPage: hasNextPageRef,
  loadNextPage: () => props.loadNextPage?.(),
  asyncStatus: asyncStatusRef,
});

defineExpose({ sortedRows });
</script>

<template>
  <UTable
    ref="table"
    :class="adminListTableClass"
    :columns="columns"
    :data="sortedRows"
    :loading="loading"
    @select="onRowSelect"
  />
</template>
