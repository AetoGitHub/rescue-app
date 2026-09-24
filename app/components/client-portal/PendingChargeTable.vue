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

/**
 * Detalle de Por Cobrar para el portal de cliente, con la misma lectura que
 * Por Facturar: encabezado neutro, sin bandas por fila y estado primero.
 */
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

usePaginatedTableInfiniteScroll({
  tableRef,
  hasNextPage: computed(() => props.hasNextPage ?? false),
  loadNextPage: () => props.loadNextPage?.(),
  asyncStatus: computed(() => props.asyncStatus ?? ('idle' as AsyncStatus)),
  autoFill: computed(() => props.filtering ?? false),
});

const UBadge = resolveComponent('UBadge');
const ColumnHeaderFilter = resolveComponent('PendingChargeColumnHeaderFilter');

const { applyOrdering } = usePendingChargeList();

/** Orden de lectura: qué factura, cómo va, cuándo vence, de quién. */
const COLUMN_ORDER: PendingChargeColumnId[] = [
  'folio',
  'status',
  'dias_vencidos',
  'vencimiento',
  'fecha_factura',
  'cliente',
  'compania',
  'rfc',
  'responsable',
];

interface ColumnLayout {
  width: string;
  align?: 'end' | 'center';
}

const COLUMN_LAYOUT: Record<PendingChargeColumnId, ColumnLayout> = {
  folio: { width: 'min-w-36' },
  status: { width: 'w-36' },
  dias_vencidos: { width: 'w-32', align: 'center' },
  vencimiento: { width: 'w-32' },
  fecha_factura: { width: 'w-32' },
  cliente: { width: 'min-w-40 max-w-56' },
  compania: { width: 'min-w-36 max-w-48' },
  rfc: { width: 'w-36' },
  responsable: { width: 'min-w-40 max-w-48' },
};

const STATUS_ICON: Record<PendingChargeRow['status'], string> = {
  vencida: 'i-lucide-alarm-clock-off',
  por_vencer: 'i-lucide-alarm-clock',
  bien: 'i-lucide-circle-check',
  sin_credito: 'i-lucide-minus-circle',
};

const DOT_CLASS = {
  error: 'bg-error',
  warning: 'bg-warning',
  success: 'bg-success',
  neutral: 'bg-neutral-400 dark:bg-neutral-500',
} as const;

function alignClass(layout: ColumnLayout): string | undefined {
  if (layout.align === 'end') return 'text-right';
  if (layout.align === 'center') return 'text-center';
  return undefined;
}

function truncatedCell(value: string, extraClass = 'text-default') {
  return h('span', { class: ['block truncate', extraClass], title: value }, value);
}

/** `dias_vencidos` ya viene recortado a 0 cuando la factura no está vencida. */
function daysLabel(row: PendingChargeRow): string {
  if (row.status === 'sin_credito') return '—';
  if (row.dias_vencidos > 0) return `${row.dias_vencidos} d`;
  return 'Sin atraso';
}

function cellFor(columnId: PendingChargeColumnId) {
  return ({ row }: { row: { original: PendingChargeRow } }) => {
    const data = row.original;

    switch (columnId) {
      case 'folio':
        return h(
          'span',
          { class: 'block truncate font-semibold tabular-nums text-highlighted' },
          data.folio,
        );
      case 'status':
        return h(UBadge, {
          color: pendingChargeStatusColor(data.status),
          variant: 'subtle',
          size: 'sm',
          class: 'rounded-full',
          icon: STATUS_ICON[data.status],
          label: PENDING_CHARGE_STATUS_LABELS[data.status],
        });
      case 'dias_vencidos': {
        const color = pendingChargeDaysColor(data.status, data.dias_vencidos);
        return h(
          'span',
          {
            class:
              'inline-flex items-center gap-1.5 rounded-full bg-elevated px-2 py-0.5 text-xs font-semibold tabular-nums text-highlighted',
          },
          [
            h('span', { class: ['size-1.5 rounded-full', DOT_CLASS[color]] }),
            daysLabel(data),
          ],
        );
      }
      case 'vencimiento':
        return h(
          'span',
          { class: 'tabular-nums text-default' },
          formatPendingInvoiceDateShort(data.vencimiento),
        );
      case 'fecha_factura':
        return h(
          'span',
          { class: 'tabular-nums text-muted' },
          formatPendingInvoiceDateShort(data.fecha_factura),
        );
      case 'rfc':
        return truncatedCell(data.rfc || '—', 'font-mono text-xs text-muted');
      case 'responsable':
        return truncatedCell(data.responsable || '—', 'text-muted');
      default:
        return truncatedCell(data[columnId] || '—');
    }
  };
}

/**
 * Los dropdowns de columna viven en `/api/dashboard/...` (403 para cliente),
 * así que aquí se filtra con los valores de las filas cargadas. El de estado
 * sí es del listado y se conserva.
 */
function headerFor(meta: PendingChargeColumnMeta) {
  const layout = COLUMN_LAYOUT[meta.id];

  return () =>
    h(ColumnHeaderFilter, {
      label: meta.label,
      kind: meta.kind,
      tone: 'plain',
      align: layout.align === 'end' ? 'end' : 'start',
      filterable: meta.kind !== 'money',
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

const columns = computed<TableColumn<PendingChargeRow>[]>(() => {
  const available = new Map(
    PENDING_CHARGE_DETAIL_COLUMNS.map(meta => [meta.id, meta]),
  );

  return COLUMN_ORDER.flatMap((id) => {
    const meta = available.get(id);
    if (!meta) return [];
    const layout = COLUMN_LAYOUT[id];
    const classes = [layout.width, alignClass(layout)].filter(Boolean).join(' ');

    return [{
      id,
      header: headerFor(meta),
      cell: cellFor(id),
      meta: { class: { th: classes, td: classes } },
    } satisfies TableColumn<PendingChargeRow>];
  });
});
</script>

<template>
  <UTable
    ref="table"
    sticky
    :columns="columns"
    :data="rows"
    empty="Ninguna factura coincide con los filtros."
    :ui="{
      root: 'min-h-0 flex-1 overflow-auto rounded-xl border border-default bg-default',
      base: 'border-separate border-spacing-0',
      thead: '[&>tr]:after:hidden',
      th: 'whitespace-nowrap border-b border-default bg-elevated px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted',
      tbody: '[&>tr]:transition-colors [&>tr:hover]:bg-elevated/50 divide-y-0',
      td: 'border-b border-default/60 px-3 py-3 text-sm align-middle',
    }"
  />
</template>
