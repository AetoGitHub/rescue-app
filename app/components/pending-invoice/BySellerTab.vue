<script setup lang="ts">
import { h, resolveComponent } from 'vue';
import type { TableColumn } from '@nuxt/ui';
import type { PendingInvoiceSellerRow } from '~/interfaces/invoicing/pending-invoice';
import {
  formatPendingInvoiceMoney,
} from '~/utils/pending-invoice-display';
import { pendingInvoiceExcelTableUi } from '~/constants/pending-invoice';

const {
  rows,
  isInitialLoading,
  isLoadingMore,
  isError,
  errorMessage,
  refresh,
} = usePendingInvoiceByResponsible();

const UBadge = resolveComponent('UBadge');
const UProgress = resolveComponent('UProgress');

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

function countCell(value: number) {
  return h(
    'span',
    { class: value === 0 ? 'tabular-nums text-dimmed' : 'tabular-nums' },
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
      const percent = row.original.porcentaje_facturado;
      return h('div', { class: 'flex flex-col items-end gap-1' }, [
        h('div', { class: 'flex items-baseline gap-2' }, [
          moneyCell(row.original.total, true),
          h(
            'span',
            { class: 'text-xs tabular-nums text-muted' },
            `${percent}%`,
          ),
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
      Participación por responsable sobre el total pendiente.
    </p>

    <PendingInvoiceTableFullscreenSection>
      <div
        v-if="isInitialLoading"
        class="flex flex-1 items-center justify-center rounded-lg border border-muted bg-default py-16"
      >
        <UIcon
          name="i-lucide-loader-circle"
          class="size-6 animate-spin text-muted"
        />
      </div>

      <div
        v-else-if="isError && rows.length === 0"
        class="flex flex-1 flex-col items-center justify-center gap-3 rounded-lg border border-muted bg-default py-16"
      >
        <p class="text-sm text-muted">
          {{ errorMessage || 'No se pudo cargar el resumen por responsable.' }}
        </p>
        <UButton
          color="neutral"
          variant="subtle"
          icon="i-lucide-refresh-cw"
          label="Reintentar"
          @click="() => void refresh()"
        />
      </div>

      <div
        v-else-if="rows.length === 0"
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

      <template v-else>
        <UTable
          sticky
          :columns="columns"
          :data="rows"
          :ui="pendingInvoiceExcelTableUi"
        />
        <p
          v-if="isLoadingMore"
          class="text-center text-xs text-muted"
        >
          Cargando más responsables…
        </p>
      </template>
    </PendingInvoiceTableFullscreenSection>
  </div>
</template>
