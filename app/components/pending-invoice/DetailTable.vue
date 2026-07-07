<script setup lang="ts">
import { h, resolveComponent } from 'vue';
import type { TableColumn, TableRow } from '@nuxt/ui';
import type { PendingInvoiceDetailRow } from '~/interfaces/invoicing/pending-invoice';
import { adminBoardListTableClass } from '~/constants/admin-list-layout';
import {
  daysSemaphoreColor,
  formatOptionalPendingCell,
  formatPendingInvoiceDateShort,
  needsAttention,
} from '~/utils/pending-invoice-display';

const props = defineProps<{
  rows: PendingInvoiceDetailRow[];
  loading?: boolean;
  hasNextPage?: boolean;
  loadNextPage?: () => unknown;
  asyncStatus?: import('@pinia/colada').AsyncStatus;
}>();

const emit = defineEmits<{
  select: [row: PendingInvoiceDetailRow];
}>();

type SortKey = 'folio' | 'dias' | 'fecha' | 'compania';

const sortKey = ref<SortKey>('dias');
const sortDesc = ref(true);
const tableRef = useTemplateRef('table');

const UBadge = resolveComponent('UBadge');
const UButton = resolveComponent('UButton');
const UIcon = resolveComponent('UIcon');

function onRowSelect(_e: Event, row: TableRow<PendingInvoiceDetailRow>) {
  emit('select', row.original);
}

function sortHeader(label: string, key: SortKey) {
  const active = sortKey.value === key;
  return h(
    'button',
    {
      type: 'button',
      class:
        'inline-flex items-center gap-1 font-medium text-highlighted hover:text-primary',
      onClick: () => {
        if (sortKey.value === key) {
          sortDesc.value = !sortDesc.value;
        } else {
          sortKey.value = key;
          sortDesc.value = key === 'dias';
        }
      },
    },
    [
      label,
      h(
        'span',
        { class: 'text-xs text-muted' },
        active ? (sortDesc.value ? '↓' : '↑') : '',
      ),
    ],
  );
}

const sortedRows = computed(() => {
  const copy = [...props.rows];
  const dir = sortDesc.value ? -1 : 1;

  copy.sort((a, b) => {
    switch (sortKey.value) {
      case 'folio':
        return a.folio.localeCompare(b.folio) * dir;
      case 'compania':
        return a.compania.localeCompare(b.compania) * dir;
      case 'fecha':
        return (
          (new Date(a.fecha).getTime() - new Date(b.fecha).getTime()) * dir
        );
      case 'dias':
      default:
        return (a.dias - b.dias) * dir;
    }
  });

  return copy;
});

const columns: TableColumn<PendingInvoiceDetailRow>[] = [
  {
    id: 'alert',
    header: '!',
    cell: ({ row }) =>
      needsAttention(row.original)
        ? h(UIcon, {
            name: 'i-lucide-alert-triangle',
            class: 'size-4 text-warning',
          })
        : h('span', { class: 'text-muted' }, '—'),
  },
  {
    id: 'folio',
    header: () => sortHeader('Folio', 'folio'),
    cell: ({ row }) =>
      h(UButton, {
        color: 'primary',
        variant: 'link',
        size: 'xs',
        class: 'px-0 font-medium',
        label: row.original.folio,
        onClick: (e: Event) => {
          e.stopPropagation();
          emit('select', row.original);
        },
      }),
  },
  { accessorKey: 'compania_grupo', header: 'Compañía (Grupo)' },
  {
    id: 'compania',
    header: () => sortHeader('Compañía', 'compania'),
    cell: ({ row }) => row.original.compania,
  },
  { accessorKey: 'responsable', header: 'Responsable' },
  { accessorKey: 'unidad', header: 'Unidad' },
  {
    id: 'autorizador',
    header: 'Autorizador',
    cell: ({ row }) => formatOptionalPendingCell(row.original.autorizador),
  },
  { accessorKey: 'mes', header: 'Mes' },
  {
    id: 'fecha',
    header: () => sortHeader('Fecha', 'fecha'),
    cell: ({ row }) => formatPendingInvoiceDateShort(row.original.fecha),
  },
  {
    id: 'dias',
    header: () => sortHeader('Días', 'dias'),
    cell: ({ row }) =>
      h(UBadge, {
        color: daysSemaphoreColor(row.original.dias),
        variant: 'subtle',
        size: 'sm',
        class: 'rounded-full',
        label: String(row.original.dias),
      }),
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) =>
      h(UBadge, {
        color: row.original.status === 'En remisión' ? 'warning' : 'neutral',
        variant: 'subtle',
        size: 'sm',
        label: row.original.status,
      }),
  },
  {
    id: 'descripcion',
    header: 'Descripción',
    cell: ({ row }) => formatOptionalPendingCell(row.original.descripcion),
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
</script>

<template>
  <UTable
    ref="table"
    sticky
    :class="adminBoardListTableClass"
    :columns="columns"
    :data="sortedRows"
    :loading="loading"
    @select="onRowSelect"
  />
</template>
