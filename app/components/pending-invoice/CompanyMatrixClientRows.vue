<script setup lang="ts">
import { pendingInvoiceExcelCellClass } from '~/constants/pending-invoice';
import {
  formatPendingInvoiceMoney,
  formatPendingInvoiceMoneyCompact,
  matrixCellAgeClass,
} from '~/utils/pending-invoice-display';

const props = defineProps<{
  companyId: number;
  months: number;
  monthKeys: string[];
}>();

const { rows, isLoading, isError, errorMessage } =
  usePendingInvoiceCompanyMatrixClients(
    () => props.companyId,
    () => props.months,
  );

const cellClass = pendingInvoiceExcelCellClass;
const columnCount = computed(() => props.monthKeys.length * 2 + 3);
</script>

<template>
  <tr v-if="isLoading">
    <td :colspan="columnCount" class="px-2.5 py-3 text-center text-sm text-muted" :class="cellClass">
      Cargando clientes…
    </td>
  </tr>
  <tr v-else-if="isError">
    <td :colspan="columnCount" class="px-2.5 py-3 text-center text-sm text-error" :class="cellClass">
      {{ errorMessage || 'No se pudieron cargar los clientes.' }}
    </td>
  </tr>
  <tr v-else-if="rows.length === 0">
    <td :colspan="columnCount" class="px-2.5 py-3 text-center text-sm text-muted" :class="cellClass">
      Sin clientes en esta ventana.
    </td>
  </tr>
  <tr
    v-for="row in rows"
    v-else
    :key="row.row_key"
    class="border-t border-default bg-elevated/30"
  >
    <td
      class="sticky left-0 z-10 bg-elevated/30 py-1.5 pl-8 pr-2.5 text-muted"
      :class="cellClass"
    >
      {{ row.cliente }}
    </td>
    <td class="px-2.5 py-1.5 text-muted" :class="cellClass">
      {{ row.responsable }}
    </td>

    <template v-for="monthKey in monthKeys" :key="`${row.row_key}-${monthKey}`">
      <td
        class="px-2.5 py-1.5 text-right text-xs tabular-nums whitespace-nowrap"
        :class="[matrixCellAgeClass(monthKey), cellClass]"
      >
        {{ formatPendingInvoiceMoneyCompact(row.meses[monthKey]?.monto ?? 0) }}
      </td>
      <td
        class="px-2.5 py-1.5 text-right text-xs tabular-nums whitespace-nowrap text-muted"
        :class="[matrixCellAgeClass(monthKey), cellClass]"
      >
        {{ row.meses[monthKey]?.eventos ?? '—' }}
      </td>
    </template>

    <td
      class="px-2.5 py-1.5 text-right text-xs font-medium tabular-nums whitespace-nowrap text-muted"
      :class="cellClass"
    >
      {{ formatPendingInvoiceMoney(row.total) }}
    </td>
  </tr>
</template>
