<script setup lang="ts">
import { h, resolveComponent } from 'vue';
import type { AsyncStatus } from '@pinia/colada';
import type { TableColumn } from '@nuxt/ui';
import type { PendingInvoiceRow } from '~/interfaces/invoicing/pending-invoice';
import { pendingInvoiceDetailColumns } from '~/constants/pending-invoice';
import type {
  PendingInvoiceColumnId,
  PendingInvoiceColumnMeta,
} from '~/constants/pending-invoice';
import type { PendingInvoiceEvidenceColumn } from '~/utils/pending-invoice-evidence';
import {
  daysSemaphoreColor,
  formatPendingInvoiceDateShort,
  formatPendingInvoiceMoney,
} from '~/utils/pending-invoice-display';
import { pendingInvoiceColumnOptions } from '~/utils/pending-invoice-aggregate';

/**
 * Detalle de Por Facturar para el portal de cliente: mismas columnas y
 * filtros que admin, con lectura más limpia (sin bandas de color por fila ni
 * accesos a pantallas internas).
 */
const props = defineProps<{
  rows: PendingInvoiceRow[];
  /** Rows before column filters, so each popover keeps its full option list. */
  optionRows: PendingInvoiceRow[];
  controller: ReturnType<typeof usePendingInvoiceColumnFilters>;
  downloadingEvidenceKey?: string | null;
  processingOcRowId?: number | null;
  hasNextPage?: boolean;
  loadNextPage?: () => unknown;
  asyncStatus?: AsyncStatus;
  filtering?: boolean;
}>();

const emit = defineEmits<{
  comment: [row: PendingInvoiceRow];
  adminDoc: [row: PendingInvoiceRow];
  evidenceZip: [row: PendingInvoiceRow, column: PendingInvoiceEvidenceColumn];
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
const UButton = resolveComponent('UButton');
const ColumnHeaderFilter = resolveComponent('PendingInvoiceColumnHeaderFilter');
const OcPdfCell = resolveComponent('PendingInvoiceOcPdfCell');

const { applyOrdering } = usePendingInvoiceList();
const reportScope = usePendingReportScope();

/** Orden de lectura: qué es, qué tan viejo, de quién, cuánto. */
const COLUMN_ORDER: PendingInvoiceColumnId[] = [
  'folio',
  'dias',
  'fecha',
  'status',
  'compania_grupo',
  'compania',
  'unidad',
  'descripcion',
  'responsable',
  'autorizador',
  'purchase_order',
  'oc_pdf',
  'subtotal',
  'iva',
  'total',
  'evidencia_rescate',
  'evidencia_pagos',
];

interface ColumnLayout {
  width: string;
  align?: 'end' | 'center';
}

const COLUMN_LAYOUT: Partial<Record<PendingInvoiceColumnId, ColumnLayout>> = {
  folio: { width: 'min-w-36' },
  dias: { width: 'w-20', align: 'center' },
  fecha: { width: 'w-28' },
  status: { width: 'w-32' },
  compania_grupo: { width: 'min-w-32 max-w-44' },
  compania: { width: 'min-w-32 max-w-44' },
  unidad: { width: 'w-28' },
  descripcion: { width: 'min-w-64 max-w-80' },
  responsable: { width: 'min-w-40 max-w-48' },
  autorizador: { width: 'min-w-40 max-w-48' },
  purchase_order: { width: 'w-32' },
  oc_pdf: { width: 'w-28', align: 'center' },
  subtotal: { width: 'w-32', align: 'end' },
  iva: { width: 'w-28', align: 'end' },
  total: { width: 'w-32', align: 'end' },
  evidencia_rescate: { width: 'w-28', align: 'center' },
  evidencia_pagos: { width: 'w-28', align: 'center' },
};

const DAYS_DOT_CLASS = {
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
} as const;

function alignClass(layout: ColumnLayout | undefined): string | undefined {
  if (layout?.align === 'end') return 'text-right';
  if (layout?.align === 'center') return 'text-center';
  return undefined;
}

function truncatedCell(value: string, extraClass = 'text-default') {
  return h('span', { class: ['block truncate', extraClass], title: value }, value);
}

function moneyCell(value: number, emphasis = false) {
  return h(
    'span',
    {
      class: [
        'block tabular-nums',
        emphasis ? 'font-semibold text-highlighted' : 'text-muted',
      ],
    },
    formatPendingInvoiceMoney(value),
  );
}

function evidenceCell(
  row: PendingInvoiceRow,
  column: PendingInvoiceEvidenceColumn,
) {
  const hasEvidence =
    column === 'evidencia_rescate' ? row.evidencia_rescate : row.evidencia_pagos;

  if (!hasEvidence) {
    return h('span', { class: 'text-dimmed' }, '—');
  }

  const isDownloading = props.downloadingEvidenceKey === `${row.id}:${column}`;
  const label =
    column === 'evidencia_rescate'
      ? 'Descargar evidencia de rescate'
      : 'Descargar evidencia de pagos';

  return h(UButton, {
    color: 'primary',
    variant: 'soft',
    size: 'xs',
    square: true,
    icon: 'i-lucide-archive',
    loading: isDownloading,
    disabled: isDownloading,
    title: label,
    'aria-label': label,
    onClick: () => emit('evidenceZip', row, column),
  });
}

function cellFor(columnId: PendingInvoiceColumnId) {
  return ({ row }: { row: { original: PendingInvoiceRow } }) => {
    const data = row.original;

    switch (columnId) {
      case 'folio':
        return h(
          'span',
          { class: 'block truncate font-semibold tabular-nums text-highlighted' },
          data.folio,
        );
      case 'dias': {
        const color = daysSemaphoreColor(data.dias);
        return h(
          'span',
          {
            class:
              'inline-flex items-center gap-1.5 rounded-full bg-elevated px-2 py-0.5 text-xs font-semibold tabular-nums text-highlighted',
            title: `${data.dias} días desde el evento`,
          },
          [
            h('span', { class: ['size-1.5 rounded-full', DAYS_DOT_CLASS[color]] }),
            `${data.dias} d`,
          ],
        );
      }
      case 'fecha':
        return h(
          'span',
          { class: 'tabular-nums text-muted' },
          formatPendingInvoiceDateShort(data.fecha),
        );
      case 'status':
        return h(UBadge, {
          color: data.status === 'En remisión' ? 'info' : 'neutral',
          variant: data.status === 'En remisión' ? 'subtle' : 'outline',
          size: 'sm',
          class: 'rounded-full',
          icon: data.status === 'En remisión' ? 'i-lucide-file-check' : 'i-lucide-clock',
          label: data.status,
        });
      case 'descripcion':
        return h(
          'span',
          {
            class: 'line-clamp-2 whitespace-normal text-pretty text-muted',
            title: data.descripcion || undefined,
          },
          data.descripcion || '—',
        );
      case 'responsable':
      case 'autorizador':
        return truncatedCell(data[columnId] || '—', 'text-muted');
      case 'purchase_order':
        return truncatedCell(data.oc || '—', data.oc ? 'text-default' : 'text-dimmed');
      case 'oc_pdf':
        return h(OcPdfCell, {
          row: data,
          isUploading: props.processingOcRowId === data.id,
          onUpload: () => emit('adminDoc', data),
        });
      case 'subtotal':
        return moneyCell(data.subtotal);
      case 'iva':
        return moneyCell(data.iva);
      case 'total':
        return moneyCell(data.total, true);
      case 'evidencia_rescate':
      case 'evidencia_pagos':
        return evidenceCell(data, columnId);
      default:
        return truncatedCell(String(data[columnId] ?? '—'));
    }
  };
}

/**
 * Los dropdowns de columna viven en `/api/dashboard/...` (403 para cliente),
 * así que aquí se filtra con los valores de las filas cargadas.
 */
function headerFor(meta: PendingInvoiceColumnMeta) {
  const layout = COLUMN_LAYOUT[meta.id];
  const filterable =
    meta.kind !== 'money' && meta.id !== 'oc_pdf' && meta.id !== 'purchase_order';

  return () =>
    h(ColumnHeaderFilter, {
      label: meta.label,
      kind: meta.kind,
      tone: 'plain',
      align: layout?.align === 'end' ? 'end' : 'start',
      filterable,
      options: pendingInvoiceColumnOptions(props.optionRows, meta.id),
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

const columns = computed<TableColumn<PendingInvoiceRow>[]>(() => {
  // Re-render archive cells while a ZIP download is in flight.
  void props.downloadingEvidenceKey;
  // Re-render the OC cell while its upload is processing.
  void props.processingOcRowId;

  const available = new Map(
    pendingInvoiceDetailColumns(reportScope.value).map(meta => [meta.id, meta]),
  );

  const dataColumns = COLUMN_ORDER.flatMap((id) => {
    const meta = available.get(id);
    if (!meta) return [];
    const layout = COLUMN_LAYOUT[id];
    const classes = [layout?.width, alignClass(layout)].filter(Boolean).join(' ');

    return [{
      id,
      header: headerFor(meta),
      cell: cellFor(id),
      meta: { class: { th: classes, td: classes } },
    } satisfies TableColumn<PendingInvoiceRow>];
  });

  return [
    ...dataColumns,
    {
      id: 'comment',
      header: () => h('span', { class: 'sr-only' }, 'Chat'),
      meta: { class: { th: 'w-12', td: 'w-12 text-center' } },
      cell: ({ row }) =>
        h(UButton, {
          color: 'neutral',
          variant: 'ghost',
          size: 'xs',
          square: true,
          icon: 'i-lucide-message-square',
          title: 'Abrir chat del evento',
          'aria-label': `Abrir chat de ${row.original.folio}`,
          onClick: () => emit('comment', row.original),
        }),
    },
  ];
});
</script>

<template>
  <UTable
    ref="table"
    sticky
    :columns="columns"
    :data="rows"
    empty="Ningún evento coincide con los filtros."
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
