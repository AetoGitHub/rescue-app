<script setup lang="ts">
import { h, resolveComponent } from 'vue';
import type { TableColumn } from '@nuxt/ui';
import type { PendingInvoiceRow } from '~/interfaces/invoicing/pending-invoice';
import type {
  PendingInvoiceColumnId,
  PendingInvoiceColumnMeta,
} from '~/constants/pending-invoice';
import { PENDING_INVOICE_DETAIL_COLUMNS } from '~/constants/pending-invoice';
import type { PendingInvoiceEvidenceColumn } from '~/utils/pending-invoice-evidence';
import {
  daysSemaphoreColor,
  formatPendingInvoiceDateShort,
  formatPendingInvoiceMoney,
  needsAttention,
  pendingInvoiceRowAgeClass,
  responsableBadgeColor,
} from '~/utils/pending-invoice-display';
import { pendingInvoiceColumnOptions } from '~/utils/pending-invoice-aggregate';

const props = defineProps<{
  rows: PendingInvoiceRow[];
  /** Rows before column filters, so each popover keeps its full option list. */
  optionRows: PendingInvoiceRow[];
  controller: ReturnType<typeof usePendingInvoiceColumnFilters>;
  downloadingEvidenceKey?: string | null;
}>();

const emit = defineEmits<{
  comment: [row: PendingInvoiceRow];
  attention: [row: PendingInvoiceRow];
  detail: [row: PendingInvoiceRow];
  evidenceZip: [row: PendingInvoiceRow, column: PendingInvoiceEvidenceColumn];
}>();

const UBadge = resolveComponent('UBadge');
const UIcon = resolveComponent('UIcon');
const ColumnHeaderFilter = resolveComponent('PendingInvoiceColumnHeaderFilter');

const HEADER_CLASS = 'bg-inverted text-inverted';

interface ColumnLayout {
  th: string;
  td: string;
  align?: 'end' | 'center';
}

const COLUMN_LAYOUT: Record<PendingInvoiceColumnId, ColumnLayout> = {
  folio: { th: 'w-32', td: 'w-32' },
  compania_grupo: { th: 'w-44', td: 'max-w-44' },
  compania: { th: 'w-44', td: 'max-w-44' },
  responsable: { th: 'w-36', td: 'max-w-36' },
  unidad: { th: 'w-28', td: 'max-w-28' },
  autorizador: { th: 'w-40', td: 'max-w-40' },
  mes: { th: 'w-20', td: 'w-20' },
  fecha: { th: 'w-28', td: 'w-28' },
  dias: { th: 'w-20', td: 'w-20', align: 'end' },
  status: { th: 'w-28', td: 'w-28' },
  descripcion: { th: 'w-72', td: 'max-w-72' },
  costo_tecnico: { th: 'w-32', td: 'w-32', align: 'end' },
  subtotal: { th: 'w-32', td: 'w-32', align: 'end' },
  iva: { th: 'w-28', td: 'w-28', align: 'end' },
  total: { th: 'w-32', td: 'w-32', align: 'end' },
  evidencia_rescate: { th: 'w-28', td: 'w-28', align: 'center' },
  evidencia_pagos: { th: 'w-28', td: 'w-28', align: 'center' },
};

function alignClass(layout: ColumnLayout): string | undefined {
  if (layout.align === 'end') return 'text-right';
  if (layout.align === 'center') return 'text-center';
  return undefined;
}

/** Single-line cell that keeps the column width and reveals the full value on hover. */
function truncatedCell(value: string) {
  return h('span', { class: 'block truncate', title: value }, value);
}

function moneyCell(value: number, emphasis = false) {
  return h(
    'span',
    {
      class: [
        'block tabular-nums',
        emphasis ? 'font-semibold text-highlighted' : 'text-default',
      ],
    },
    formatPendingInvoiceMoney(value),
  );
}

function evidenceKey(row: PendingInvoiceRow, column: PendingInvoiceEvidenceColumn) {
  return `${row.id}:${column}`;
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

  const isDownloading = props.downloadingEvidenceKey === evidenceKey(row, column);
  const label =
    column === 'evidencia_rescate'
      ? 'Descargar evidencia de rescate'
      : 'Descargar evidencia de pagos';

  return h(
    'button',
    {
      type: 'button',
      class:
        'inline-flex text-primary hover:text-primary/80 disabled:cursor-wait disabled:opacity-60',
      title: label,
      'aria-label': label,
      disabled: isDownloading,
      onClick: () => emit('evidenceZip', row, column),
    },
    [
      h(UIcon, {
        name: isDownloading ? 'i-lucide-loader-circle' : 'i-lucide-archive',
        class: ['size-4', isDownloading ? 'animate-spin' : undefined],
      }),
    ],
  );
}

function cellFor(columnId: PendingInvoiceColumnId) {
  return ({ row }: { row: { original: PendingInvoiceRow } }) => {
    const data = row.original;

    switch (columnId) {
      case 'folio':
        return h(
          'button',
          {
            type: 'button',
            class:
              'block truncate font-semibold text-primary hover:underline',
            onClick: () => emit('detail', data),
          },
          data.folio,
        );
      case 'responsable':
        return h(UBadge, {
          color: responsableBadgeColor(data.responsable),
          variant: 'subtle',
          size: 'sm',
          class: 'max-w-full truncate',
          label: data.responsable,
        });
      case 'mes':
        return h('span', { class: 'text-muted' }, data.mes);
      case 'fecha':
        return h(
          'span',
          { class: 'tabular-nums' },
          formatPendingInvoiceDateShort(data.fecha),
        );
      case 'dias':
        return h(UBadge, {
          color: daysSemaphoreColor(data.dias),
          variant: 'subtle',
          size: 'sm',
          class: 'rounded-full tabular-nums',
          label: String(data.dias),
        });
      case 'status':
        return h(UBadge, {
          color: data.status === 'En remisión' ? 'info' : 'neutral',
          variant: 'subtle',
          size: 'sm',
          label: data.status,
        });
      case 'descripcion':
        return h(
          'span',
          { class: 'block whitespace-normal text-pretty text-muted' },
          data.descripcion || '—',
        );
      case 'costo_tecnico':
        return moneyCell(data.costo_tecnico);
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
        return truncatedCell(data[columnId] as string);
    }
  };
}

function headerFor(meta: PendingInvoiceColumnMeta) {
  const layout = COLUMN_LAYOUT[meta.id];

  return () =>
    h(ColumnHeaderFilter, {
      label: meta.label,
      kind: meta.kind,
      align: layout.align === 'end' ? 'end' : 'start',
      // Money columns have ~one distinct value per row, so only sorting helps.
      filterable: meta.kind !== 'money',
      options: pendingInvoiceColumnOptions(props.optionRows, meta.id),
      selected: props.controller.selectionFor(meta.id),
      sortActive: props.controller.sortColumn.value === meta.id,
      sortDescending: props.controller.sortDescending.value,
      'onUpdate:selected': (values: string[]) =>
        props.controller.setSelection(meta.id, values),
      onSort: (descending: boolean) =>
        props.controller.applySort(meta.id, descending),
    });
}

const columns = computed<TableColumn<PendingInvoiceRow>[]>(() => {
  // Re-render archive cells while a ZIP download is in flight.
  void props.downloadingEvidenceKey;

  return [
  {
    id: 'alert',
    header: () =>
      h(
        'span',
        {
          class: 'font-bold text-inverted',
          title: 'En remisión sin número de OC',
        },
        '!',
      ),
    meta: {
      class: {
        th: `${HEADER_CLASS} w-9`,
        td: 'w-9',
      },
    },
    cell: ({ row }) => {
      if (!needsAttention(row.original)) {
        return h('span', { class: 'text-dimmed' }, '—');
      }
      return h(
        'button',
        {
          type: 'button',
          class: 'flex text-warning hover:text-warning/80',
          title: 'Sin número de OC — abrir en Operación',
          onClick: () => emit('attention', row.original),
        },
        [h(UIcon, { name: 'i-lucide-triangle-alert', class: 'size-4' })],
      );
    },
  },
  {
    id: 'comment',
    header: () =>
      h(UIcon, {
        name: 'i-lucide-message-square',
        class: 'size-3.5 text-inverted',
        'aria-label': 'Comentarios',
      }),
    meta: {
      class: {
        th: `${HEADER_CLASS} w-9`,
        td: 'w-9',
      },
    },
    cell: ({ row }) =>
      h(
        'button',
        {
          type: 'button',
          class: 'relative flex text-muted hover:text-primary',
          title: 'Abrir chat del rescate',
          onClick: () => emit('comment', row.original),
        },
        [h(UIcon, { name: 'i-lucide-message-square', class: 'size-4' })],
      ),
  },
  ...PENDING_INVOICE_DETAIL_COLUMNS.map(meta => {
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
    } satisfies TableColumn<PendingInvoiceRow>;
  }),
];
});

const tableMeta = {
  class: {
    tr: (row: { original: PendingInvoiceRow }) =>
      `${pendingInvoiceRowAgeClass(row.original.dias)} hover:bg-elevated/60`,
  },
};
</script>

<template>
  <UTable
    sticky
    :columns="columns"
    :data="rows"
    :meta="tableMeta"
    empty="Ningún evento coincide con los filtros."
    :ui="{
      root: 'min-h-0 flex-1 overflow-auto rounded-lg border border-muted bg-default',
      thead: '[&>tr]:bg-inverted',
      th: 'py-2 px-2.5 text-xs',
      td: 'py-1.5 px-2.5 text-sm align-middle',
    }"
  />
</template>
