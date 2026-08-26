<script setup lang="ts">
import { h, resolveComponent } from 'vue';
import type { AsyncStatus } from '@pinia/colada';
import type { TableColumn } from '@nuxt/ui';
import type { PendingChargeRow } from '~/interfaces/invoicing/pending-charge';
import type {
  PendingChargeColumnId,
  PendingChargeColumnMeta,
} from '~/constants/pending-charge';
import {
  PENDING_CHARGE_DETAIL_COLUMNS,
  PENDING_CHARGE_STATUS_LABELS,
} from '~/constants/pending-charge';
import { pendingInvoiceExcelTableUi } from '~/constants/pending-invoice';

const props = defineProps<{
  rows: PendingChargeRow[];
  optionRows: PendingChargeRow[];
  controller: ReturnType<typeof usePendingChargeColumnFilters>;
  hasNextPage?: boolean;
  loadNextPage?: () => unknown;
  asyncStatus?: AsyncStatus;
  filtering?: boolean;
}>();

const tableRef = useTemplateRef('table');
const hasNextPageRef = computed(() => props.hasNextPage ?? false);
const asyncStatusRef = computed(
  () => props.asyncStatus ?? ('idle' as AsyncStatus),
);
const autoFillRef = computed(() => props.filtering ?? false);

usePaginatedTableInfiniteScroll({
  tableRef,
  hasNextPage: hasNextPageRef,
  loadNextPage: () => props.loadNextPage?.(),
  asyncStatus: asyncStatusRef,
  autoFill: autoFillRef,
});

const UBadge = resolveComponent('UBadge');
const ColumnHeaderFilter = resolveComponent('PendingChargeColumnHeaderFilter');

const { applyOrdering } = usePendingChargeList();

const HEADER_CLASS = 'bg-sheet-header text-sheet-header-foreground';

interface ColumnLayout {
  th: string;
  td: string;
  align?: 'end' | 'center';
}

const COLUMN_LAYOUT: Record<PendingChargeColumnId, ColumnLayout> = {
  cliente: { th: 'w-48', td: 'max-w-48' },
  compania: { th: 'w-44', td: 'max-w-44' },
  rfc: { th: 'w-36', td: 'max-w-36' },
  responsable: { th: 'w-40', td: 'max-w-40' },
  fecha_factura: { th: 'w-28', td: 'w-28' },
  vencimiento: { th: 'w-28', td: 'w-28' },
  dias_vencidos: { th: 'w-28', td: 'w-28', align: 'end' },
  status: { th: 'w-32', td: 'w-32' },
  total: { th: 'w-32', td: 'w-32', align: 'end' },
};

function alignClass(layout: ColumnLayout): string | undefined {
  if (layout.align === 'end') return 'text-right';
  if (layout.align === 'center') return 'text-center';
  return undefined;
}

function truncatedCell(value: string) {
  return h('span', { class: 'block truncate', title: value }, value);
}

function moneyCell(value: number) {
  return h(
    'span',
    { class: 'block tabular-nums font-semibold text-highlighted' },
    formatPendingInvoiceMoney(value),
  );
}

function cellFor(columnId: PendingChargeColumnId) {
  return ({ row }: { row: { original: PendingChargeRow } }) => {
    const data = row.original;

    switch (columnId) {
      case 'responsable':
        return h(UBadge, {
          color: responsableBadgeColor(data.responsable),
          variant: 'subtle',
          size: 'sm',
          class: 'max-w-full truncate',
          label: data.responsable,
        });
      case 'fecha_factura':
        return h(
          'span',
          { class: 'tabular-nums' },
          formatPendingInvoiceDateShort(data.fecha_factura),
        );
      case 'vencimiento':
        return h(
          'span',
          { class: 'tabular-nums' },
          formatPendingInvoiceDateShort(data.vencimiento),
        );
      case 'dias_vencidos':
        return h(UBadge, {
          color: pendingChargeDaysColor(data.status, data.dias_vencidos),
          variant: 'subtle',
          size: 'sm',
          class: 'rounded-full tabular-nums',
          label: String(data.dias_vencidos),
        });
      case 'status':
        return h(UBadge, {
          color: pendingChargeStatusColor(data.status),
          variant: 'subtle',
          size: 'sm',
          label: PENDING_CHARGE_STATUS_LABELS[data.status],
        });
      case 'total':
        return moneyCell(data.total);
      default:
        return truncatedCell(data[columnId] as string);
    }
  };
}

function headerFor(meta: PendingChargeColumnMeta) {
  const layout = COLUMN_LAYOUT[meta.id];
  const filterable = meta.kind !== 'money';

  return () =>
    h(ColumnHeaderFilter, {
      label: meta.label,
      kind: meta.kind,
      align: layout.align === 'end' ? 'end' : 'start',
      filterable,
      dropdown: meta.dropdown,
      statusFilter: meta.id === 'status',
      options: pendingChargeColumnOptions(props.optionRows, meta.id),
      selected: props.controller.selectionFor(meta.id),
      sortActive: props.controller.sortColumn.value === meta.id,
      sortDescending: props.controller.sortDescending.value,
      'onUpdate:selected': (values: string[]) =>
        props.controller.setSelection(meta.id, values),
      onSort: (descending: boolean) => {
        props.controller.applySort(meta.id, descending);
        applyOrdering(meta, descending);
      },
    });
}

const columns = computed<TableColumn<PendingChargeRow>[]>(() =>
  PENDING_CHARGE_DETAIL_COLUMNS.map(meta => {
    const layout = COLUMN_LAYOUT[meta.id];
    const align = alignClass(layout);

    return {
      id: meta.id,
      header: headerFor(meta),
      cell: cellFor(meta.id),
      meta: {
        class: {
          th: [HEADER_CLASS, layout.th, align].filter(Boolean).join(' '),
          td: [layout.td, align].filter(Boolean).join(' '),
        },
      },
    } satisfies TableColumn<PendingChargeRow>;
  }),
);

const tableMeta = {
  class: {
    tr: (row: { original: PendingChargeRow }) =>
      `${pendingChargeRowAgeClass(row.original.status)} hover:bg-elevated/60`,
  },
};
</script>

<template>
  <UTable
    ref="table"
    sticky
    :columns="columns"
    :data="rows"
    :meta="tableMeta"
    empty="Ningún cliente coincide con los filtros."
    :ui="{
      ...pendingInvoiceExcelTableUi,
      th: 'py-2 px-2.5 text-xs',
      td: 'py-1.5 px-2.5 text-sm align-middle',
    }"
  />
</template>
