<script setup lang="ts">
import { h, resolveComponent } from 'vue';
import type { TableColumn } from '@nuxt/ui';
import type { PendingInvoiceSellerRow } from '~/interfaces/invoicing/pending-invoice';
import {
  daysSemaphoreTextClass,
  formatPendingInvoiceMoney,
} from '~/utils/pending-invoice-display';
import { buildPendingInvoiceSellerRows } from '~/utils/pending-invoice-aggregate';
import { pendingInvoiceExcelTableUi } from '~/constants/pending-invoice';

const { scopedRows } = usePendingInvoiceList();

const UBadge = resolveComponent('UBadge');
const UIcon = resolveComponent('UIcon');
const UProgress = resolveComponent('UProgress');

const rows = computed(() => buildPendingInvoiceSellerRows(scopedRows.value));

const totals = computed(() =>
  rows.value.reduce(
    (accumulator, row) => ({
      eventos: accumulator.eventos + row.eventos,
      sin_atender: accumulator.sin_atender + row.sin_atender,
      remision: accumulator.remision + row.remision,
      atencion: accumulator.atencion + row.atencion,
      subtotal: accumulator.subtotal + row.subtotal,
      iva: accumulator.iva + row.iva,
      total: accumulator.total + row.total,
    }),
    {
      eventos: 0,
      sin_atender: 0,
      remision: 0,
      atencion: 0,
      subtotal: 0,
      iva: 0,
      total: 0,
    },
  ),
);

function sharePercent(total: number): number {
  if (totals.value.total <= 0) return 0;
  return Math.round((total / totals.value.total) * 1000) / 10;
}

function countCell(value: number) {
  return h(
    'span',
    { class: value === 0 ? 'tabular-nums text-dimmed' : 'tabular-nums' },
    String(value),
  );
}

function daysCell(value: number) {
  return h(
    'span',
    { class: ['font-medium tabular-nums', daysSemaphoreTextClass(value)] },
    String(value),
  );
}

function moneyCell(value: number, emphasis = false) {
  return h(
    'span',
    {
      class: [
        'tabular-nums',
        emphasis ? 'font-semibold text-highlighted' : 'text-muted',
      ],
    },
    formatPendingInvoiceMoney(value),
  );
}

function footerCell(content: unknown, align = 'text-right') {
  return h('span', { class: ['font-semibold', align] }, content as string);
}

// UTable renders footer cells as `th`, so this aligns header, body and totals.
const numericMeta = {
  class: { th: 'text-right', td: 'text-right' },
} as const;

const columns = computed<TableColumn<PendingInvoiceSellerRow>[]>(() => [
  {
    id: 'responsable',
    header: 'Responsable AETO',
    cell: ({ row }) =>
      h(
        'span',
        { class: 'font-medium text-highlighted' },
        row.original.responsable,
      ),
    footer: () => footerCell('Total', 'text-left'),
  },
  {
    id: 'eventos',
    header: 'Eventos',
    meta: numericMeta,
    cell: ({ row }) =>
      h('span', { class: 'font-medium tabular-nums' }, String(row.original.eventos)),
    footer: () => footerCell(String(totals.value.eventos)),
  },
  {
    id: 'sin_atender',
    header: 'Sin atender',
    meta: numericMeta,
    cell: ({ row }) => countCell(row.original.sin_atender),
    footer: () => footerCell(String(totals.value.sin_atender)),
  },
  {
    id: 'remision',
    header: 'Remisión',
    meta: numericMeta,
    cell: ({ row }) => countCell(row.original.remision),
    footer: () => footerCell(String(totals.value.remision)),
  },
  {
    id: 'atencion',
    header: 'Atención',
    meta: numericMeta,
    cell: ({ row }) => {
      const value = row.original.atencion;
      if (value === 0) return countCell(0);
      return h(UBadge, {
        color: 'warning',
        variant: 'subtle',
        size: 'sm',
        class: 'tabular-nums',
        label: String(value),
        icon: 'i-lucide-triangle-alert',
      });
    },
    footer: () => footerCell(String(totals.value.atencion)),
  },
  {
    id: 'dias_prom',
    header: 'Días prom.',
    meta: numericMeta,
    cell: ({ row }) => daysCell(row.original.dias_prom),
    footer: () => footerCell('—'),
  },
  {
    id: 'dias_max',
    header: 'Días máx.',
    meta: numericMeta,
    cell: ({ row }) => daysCell(row.original.dias_max),
    footer: () => footerCell('—'),
  },
  {
    id: 'subtotal',
    header: 'Subtotal',
    meta: numericMeta,
    cell: ({ row }) => moneyCell(row.original.subtotal),
    footer: () => footerCell(formatPendingInvoiceMoney(totals.value.subtotal)),
  },
  {
    id: 'iva',
    header: 'IVA',
    meta: numericMeta,
    cell: ({ row }) => moneyCell(row.original.iva),
    footer: () => footerCell(formatPendingInvoiceMoney(totals.value.iva)),
  },
  {
    id: 'total',
    header: 'Total c/IVA',
    meta: { class: { th: 'text-right w-56', td: 'w-56' } },
    cell: ({ row }) => {
      const percent = sharePercent(row.original.total);
      return h('div', { class: 'flex flex-col items-end gap-1' }, [
        h('div', { class: 'flex items-baseline gap-2' }, [
          moneyCell(row.original.total, true),
          h('span', { class: 'text-xs tabular-nums text-muted' }, `${percent}%`),
        ]),
        h(UProgress, { modelValue: percent, max: 100, size: 'xs' }),
      ]);
    },
    footer: () => footerCell(formatPendingInvoiceMoney(totals.value.total)),
  },
]);
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col gap-3">
    <p class="text-sm text-muted">
      Participación por vendedor sobre el total pendiente, de mayor a menor
      monto. Los días usan el semáforo 30/60.
    </p>

    <div
      v-if="rows.length === 0"
      class="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-muted bg-default py-16"
    >
      <UIcon
        name="i-lucide-user-x"
        class="size-6 text-dimmed"
      />
      <p class="text-sm text-muted">
        Sin eventos para el filtro de compañía seleccionado.
      </p>
    </div>

    <UTable
      v-else
      sticky
      :columns="columns"
      :data="rows"
      :ui="pendingInvoiceExcelTableUi"
    />
  </div>
</template>
