<script setup lang="ts">
import { h, resolveComponent } from 'vue';
import type { TableColumn, TableRow } from '@nuxt/ui';
import { adminBoardListTableClass } from '~/constants/admin-list-layout';
import type { RescueCard } from '~/interfaces/rescue';
import type { RescueTableBadgeComponents } from '~/utils/rescue-table-display';

const props = defineProps<{
  rows: RescueCard[];
  loading?: boolean;
  hasNextPage?: boolean;
  loadNextPage?: () => unknown;
  asyncStatus?: import('@pinia/colada').AsyncStatus;
}>();

const emit = defineEmits<{
  select: [card: RescueCard];
}>();

const tableRef = useTemplateRef('table');

const UButton = resolveComponent('UButton');
const UBadge = resolveComponent('UBadge');
const UIcon = resolveComponent('UIcon');

const badgeComponents: RescueTableBadgeComponents = {
  UBadge,
  UIcon,
};

function formatPhaseStartedAt(isoDate: string | null | undefined): string {
  if (!isoDate) return '—';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('es-MX', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function onRowSelect(_e: Event, row: TableRow<RescueCard>) {
  emit('select', row.original);
}

const columns: TableColumn<RescueCard>[] = [
  {
    accessorKey: 'folio',
    header: 'Folio',
    cell: ({ row }) => renderRescueTableFolio(row.original.folio),
  },
  {
    id: 'service_type',
    header: 'Tipo',
    cell: ({ row }) =>
      renderRescueTableServiceTypeBadge(
        badgeComponents,
        row.original.service_type,
      ),
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
    cell: ({ row }) =>
      renderRescueTableSupplierBadge(
        badgeComponents,
        row.original.supplier_name,
      ),
  },
  {
    id: 'sub_total',
    header: 'Subtotal',
    cell: ({ row }) => renderRescueTableMoney(row.original.sub_total),
  },
  {
    id: 'operative_status',
    header: 'Estatus Op.',
    cell: ({ row }) =>
      renderRescueTableOperativeStatusBadge(
        badgeComponents,
        row.original.operative_status,
      ),
  },
  {
    id: 'admin_status',
    header: 'Estatus admin',
    cell: ({ row }) =>
      renderRescueTableBillingStatusBadge(
        badgeComponents,
        row.original.admin_status,
      ),
  },
  {
    id: 'phase_started_at',
    header: 'Última fase',
    cell: ({ row }) => formatPhaseStartedAt(row.original.phase_started_at),
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
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <UTable
      ref="table"
      sticky
      :class="adminBoardListTableClass"
      :columns="columns"
      :data="rows"
      :loading="loading"
      @select="onRowSelect"
    />
  </div>
</template>
