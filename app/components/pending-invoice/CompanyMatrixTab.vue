<script setup lang="ts">
import type { PendingInvoiceMatrixMonths } from '~/constants/pending-invoice';
import {
  PENDING_INVOICE_DEFAULT_MATRIX_MONTHS,
  PENDING_INVOICE_MATRIX_WINDOW_OPTIONS,
  pendingInvoiceExcelCellClass,
  pendingInvoiceExcelHeaderCellClass,
} from '~/constants/pending-invoice';
import {
  formatMatrixMonthLabel,
  formatPendingInvoiceMoney,
  formatPendingInvoiceMoneyCompact,
  matrixCellAgeClass,
} from '~/utils/pending-invoice-display';

const months = ref<PendingInvoiceMatrixMonths>(
  PENDING_INVOICE_DEFAULT_MATRIX_MONTHS,
);

const {
  matrix,
  isInitialLoading,
  isError,
  errorMessage,
  refresh,
} = usePendingInvoiceCompanyMatrix(months);

const monthKeys = computed(() => matrix.value.month_keys);
const columnCount = computed(() => monthKeys.value.length * 2 + 3);

const headerCellClass = pendingInvoiceExcelHeaderCellClass;
const cellClass = pendingInvoiceExcelCellClass;
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col gap-3">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <span class="text-sm text-muted">Ventana:</span>
        <USelect
          v-model="months"
          :items="[...PENDING_INVOICE_MATRIX_WINDOW_OPTIONS]"
          value-key="value"
          label-key="label"
          class="min-w-44"
          variant="subtle"
          :ui="{ base: 'bg-default' }"
        />
      </div>
      <p class="text-sm text-muted">
        {{ matrix.rows.length }} clientes ·
        {{ matrix.totals.eventos }} eventos ·
        {{ formatPendingInvoiceMoney(matrix.totals.total) }} c/IVA
      </p>
    </div>

    <div
      v-if="isInitialLoading"
      class="flex min-h-48 flex-1 items-center justify-center rounded-lg border border-muted bg-default"
    >
      <UIcon
        name="i-lucide-loader-circle"
        class="size-6 animate-spin text-muted"
      />
    </div>

    <div
      v-else-if="isError"
      class="flex min-h-48 flex-1 flex-col items-center justify-center gap-3 rounded-lg border border-muted bg-default p-6 text-center"
    >
      <p class="text-sm text-muted">
        {{ errorMessage || 'No se pudo cargar la matriz por compañía.' }}
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
      v-else
      class="min-h-0 flex-1 overflow-auto rounded-lg border border-muted bg-default"
    >
      <table class="min-w-full border-collapse text-sm">
        <thead class="sticky top-0 z-20">
          <tr class="text-left text-xs font-semibold uppercase tracking-wider">
            <th
              rowspan="2"
              class="sticky left-0 z-30 min-w-48"
              :class="headerCellClass"
            >
              Cliente
            </th>
            <th
              rowspan="2"
              class="min-w-40"
              :class="headerCellClass"
            >
              Responsable
            </th>
            <th
              v-for="monthKey in monthKeys"
              :key="monthKey"
              colspan="2"
              class="text-center whitespace-nowrap"
              :class="headerCellClass"
            >
              {{ formatMatrixMonthLabel(monthKey) }}
            </th>
            <th
              rowspan="2"
              class="text-right whitespace-nowrap"
              :class="headerCellClass"
            >
              Total
            </th>
          </tr>
          <tr class="text-xs">
            <template
              v-for="monthKey in monthKeys"
              :key="`${monthKey}-sub`"
            >
              <th
                class="px-2.5 py-1 text-right font-medium opacity-75"
                :class="headerCellClass"
              >
                $
              </th>
              <th
                class="px-2.5 py-1 text-right font-medium opacity-75"
                :class="headerCellClass"
              >
                #
              </th>
            </template>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="row in matrix.rows"
            :key="row.row_key"
            class="border-t border-default hover:bg-elevated/50"
          >
            <td
              class="sticky left-0 z-10 bg-default px-2.5 py-2 font-medium text-highlighted"
              :class="cellClass"
            >
              {{ row.cliente }}
            </td>
            <td
              class="px-2.5 py-2 text-muted"
              :class="cellClass"
            >
              {{ row.responsable }}
            </td>

            <template
              v-for="monthKey in monthKeys"
              :key="`${row.row_key}-${monthKey}`"
            >
              <td
                class="px-2.5 py-2 text-right tabular-nums whitespace-nowrap"
                :class="[matrixCellAgeClass(monthKey), cellClass]"
              >
                <span :class="row.meses[monthKey] ? undefined : 'text-dimmed'">
                  {{ formatPendingInvoiceMoneyCompact(row.meses[monthKey]?.monto ?? 0) }}
                </span>
              </td>
              <td
                class="px-2.5 py-2 text-right text-xs tabular-nums whitespace-nowrap text-muted"
                :class="[matrixCellAgeClass(monthKey), cellClass]"
              >
                {{ row.meses[monthKey]?.eventos ?? '—' }}
              </td>
            </template>

            <td
              class="px-2.5 py-2 text-right font-semibold tabular-nums whitespace-nowrap text-highlighted"
              :class="cellClass"
            >
              {{ formatPendingInvoiceMoney(row.total) }}
            </td>
          </tr>

          <tr v-if="matrix.rows.length === 0">
            <td
              :colspan="columnCount"
              class="px-2.5 py-16 text-center text-sm text-muted"
            >
              Sin eventos en la ventana de {{ months }} meses seleccionada.
            </td>
          </tr>
        </tbody>

        <tfoot v-if="matrix.rows.length > 0">
          <tr class="border-t-2 border-default bg-elevated/60 font-semibold">
            <td
              class="sticky left-0 z-10 bg-elevated/60 px-2.5 py-2"
              :class="cellClass"
            >
              Totales
            </td>
            <td
              class="px-2.5 py-2"
              :class="cellClass"
            >
              —
            </td>
            <template
              v-for="monthKey in monthKeys"
              :key="`total-${monthKey}`"
            >
              <td
                class="px-2.5 py-2 text-right tabular-nums whitespace-nowrap"
                :class="cellClass"
              >
                {{ formatPendingInvoiceMoneyCompact(matrix.totals.meses[monthKey]?.monto ?? 0) }}
              </td>
              <td
                class="px-2.5 py-2 text-right text-xs tabular-nums whitespace-nowrap text-muted"
                :class="cellClass"
              >
                {{ matrix.totals.meses[monthKey]?.eventos ?? '—' }}
              </td>
            </template>
            <td
              class="px-2.5 py-2 text-right tabular-nums whitespace-nowrap text-highlighted"
              :class="cellClass"
            >
              {{ formatPendingInvoiceMoney(matrix.totals.total) }}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>

    <p class="text-xs text-dimmed">
      Celdas sin color: mes actual · ámbar: mes anterior · rojo: dos meses o más
      de antigüedad.
    </p>
  </div>
</template>
