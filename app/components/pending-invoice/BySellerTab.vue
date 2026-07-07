<script setup lang="ts">
import { h, resolveComponent } from 'vue';
import type { TableColumn } from '@nuxt/ui';
import type { PendingInvoiceBySellerRow } from '~/interfaces/invoicing/pending-invoice';
import { adminListTableClass } from '~/constants/admin-list-layout';
import {
  daysSemaphoreTextClass,
} from '~/utils/pending-invoice-display';

const props = defineProps<{
  rows: PendingInvoiceBySellerRow[];
  totalAmount: number;
  footerTotals: { eventos: number; total: number };
  loading?: boolean;
}>();

const UProgress = resolveComponent('UProgress');

function sharePercent(total: number): number {
  if (props.totalAmount <= 0) return 0;
  return Math.round((total / props.totalAmount) * 1000) / 10;
}

const tableRows = computed(() => [
  ...props.rows,
  {
    responsable_id: -1,
    responsable_nombre: 'Total',
    total: props.footerTotals.total,
    eventos: props.footerTotals.eventos,
    dias_max: 0,
    _isTotal: true,
  } as PendingInvoiceBySellerRow & { _isTotal?: boolean },
]);

const columns: TableColumn<PendingInvoiceBySellerRow & { _isTotal?: boolean }>[] = [
  {
    accessorKey: 'responsable_nombre',
    header: 'Responsable AETO',
    cell: ({ row }) =>
      h(
        'span',
        { class: row.original._isTotal ? 'font-semibold' : undefined },
        row.original.responsable_nombre,
      ),
  },
  {
    id: 'eventos',
    header: 'Eventos',
    cell: ({ row }) =>
      h(
        'span',
        { class: row.original._isTotal ? 'font-semibold tabular-nums' : 'tabular-nums' },
        row.original.eventos,
      ),
  },
  {
    id: 'dias_max',
    header: 'Días máx.',
    cell: ({ row }) => {
      if (row.original._isTotal) {
        return h('span', { class: 'text-muted' }, '—');
      }
      return h(
        'span',
        {
          class: [
            'font-medium tabular-nums',
            daysSemaphoreTextClass(row.original.dias_max),
          ],
        },
        String(row.original.dias_max),
      );
    },
  },
  {
    id: 'total',
    header: 'Total c/IVA',
    cell: ({ row }) =>
      h(
        'span',
        { class: row.original._isTotal ? 'font-semibold tabular-nums' : 'tabular-nums' },
        formatRescueCardMoney(row.original.total),
      ),
  },
  {
    id: 'share',
    header: '% del total',
    cell: ({ row }) => {
      if (row.original._isTotal) {
        return h('span', { class: 'font-semibold tabular-nums' }, '100%');
      }
      const percent = sharePercent(row.original.total);
      return h('div', { class: 'flex min-w-32 flex-col gap-1' }, [
        h('span', { class: 'text-sm tabular-nums' }, `${percent}%`),
        h(UProgress, {
          modelValue: percent,
          max: 100,
          size: 'xs',
        }),
      ]);
    },
  },
];
</script>

<template>
  <UTable
    :class="adminListTableClass"
    :columns="columns"
    :data="tableRows"
    :loading="loading"
  />
</template>
