<script setup lang="ts">
import { h, resolveComponent } from 'vue';
import type { TableColumn, TableRow } from '@nuxt/ui';
import { RESCUE_ADMIN_STATUS_LABELS } from '~/constants/operational-rescue-detail';
import { adminListTableClass } from '~/constants/admin-list-layout';
import type { RescueCard } from '~/interfaces/rescue';

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

function formatPhaseStartedAt(isoDate: string | null | undefined): string {
  if (!isoDate) return '—';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('es-MX', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function getGestorAgentBadge(adminStatus: string | null | undefined): {
  label: string;
  color: string;
} {
  const config = RESCUE_ADMIN_STATUS_LABELS[adminStatus ?? ''];
  if (config) {
    return { label: config.label, color: config.color };
  }

  return { label: adminStatus?.replaceAll('_', ' ') ?? '—', color: 'neutral' };
}

function onRowSelect(_e: Event, row: TableRow<RescueCard>) {
  emit('select', row.original);
}

const columns: TableColumn<RescueCard>[] = [
  {
    accessorKey: 'folio',
    header: 'Folio',
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
    id: 'sub_total',
    header: 'Subtotal',
    cell: ({ row }) => formatRescueCardMoney(row.original.sub_total),
  },
  {
    id: 'operative_status',
    header: 'Estatus Op.',
    cell: ({ row }) =>
      getAdministrativeOperativeStatusLabel(row.original.operative_status),
  },
  {
    id: 'admin_status',
    header: 'Agente gestor',
    cell: ({ row }) => {
      const badge = getGestorAgentBadge(row.original.admin_status);
      return h(UBadge, {
        color: badge.color,
        variant: 'subtle',
        size: 'sm',
        label: badge.label,
      });
    },
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
  <UTable
    ref="table"
    :class="adminListTableClass"
    :columns="columns"
    :data="rows"
    :loading="loading"
    @select="onRowSelect"
  />
</template>
