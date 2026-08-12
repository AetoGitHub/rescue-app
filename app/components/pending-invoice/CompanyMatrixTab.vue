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
import { buildPendingInvoiceMatrix } from '~/utils/pending-invoice-aggregate';

const { scopedRows, focusCompany } = usePendingInvoiceList();

const months = ref<PendingInvoiceMatrixMonths>(
  PENDING_INVOICE_DEFAULT_MATRIX_MONTHS,
);
const expanded = ref<string[]>([]);

const matrix = computed(() =>
  buildPendingInvoiceMatrix(scopedRows.value, months.value),
);

const monthKeys = computed(() => matrix.value.month_keys);
const columnCount = computed(() => monthKeys.value.length * 2 + 2);

function isExpanded(compania: string): boolean {
  return expanded.value.includes(compania);
}

function toggle(compania: string) {
  expanded.value = isExpanded(compania)
    ? expanded.value.filter(name => name !== compania)
    : [...expanded.value, compania];
}

const allExpanded = computed(
  () =>
    matrix.value.rows.length > 0 &&
    expanded.value.length === matrix.value.rows.length,
);

function toggleAll() {
  expanded.value = allExpanded.value
    ? []
    : matrix.value.rows.map(row => row.compania);
}

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
        <UButton
          color="neutral"
          variant="outline"
          :icon="allExpanded ? 'i-lucide-chevrons-down-up' : 'i-lucide-chevrons-up-down'"
          :disabled="matrix.rows.length === 0"
          :label="allExpanded ? 'Colapsar todo' : 'Expandir todo'"
          @click="toggleAll"
        />
      </div>
      <p class="text-sm text-muted">
        {{ matrix.rows.length }} compañías ·
        {{ matrix.totals.eventos }} eventos ·
        {{ formatPendingInvoiceMoney(matrix.totals.total) }} c/IVA
      </p>
    </div>

    <div class="min-h-0 flex-1 overflow-auto rounded-lg border border-muted bg-default">
      <table class="min-w-full border-collapse text-sm">
        <thead class="sticky top-0 z-20">
          <tr class="text-left text-xs font-semibold uppercase tracking-wider">
            <th
              rowspan="2"
              class="sticky left-0 z-30 min-w-56"
              :class="headerCellClass"
            >
              Compañía
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
          <template
            v-for="row in matrix.rows"
            :key="row.compania"
          >
            <tr class="border-t border-default hover:bg-elevated/50">
              <td
                class="sticky left-0 z-10 bg-default px-2.5 py-2"
                :class="cellClass"
              >
                <div class="flex items-center gap-1">
                  <UButton
                    :icon="isExpanded(row.compania) ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    :aria-label="`Desglosar ${row.compania} por autorizador`"
                    @click="toggle(row.compania)"
                  />
                  <button
                    type="button"
                    class="truncate text-left font-medium text-primary hover:underline"
                    :title="`Ver ${row.compania} en el tab Detalle`"
                    @click="focusCompany(row.compania)"
                  >
                    {{ row.compania }}
                  </button>
                </div>
              </td>

              <template
                v-for="monthKey in monthKeys"
                :key="`${row.compania}-${monthKey}`"
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

            <tr
              v-for="authorizer in isExpanded(row.compania) ? row.autorizadores : []"
              :key="`${row.compania}-${authorizer.autorizador}`"
              class="border-t border-default/60 bg-elevated/30 text-xs"
            >
              <td
                class="sticky left-0 z-10 bg-elevated/30 py-1.5 pe-2.5 ps-11"
                :class="cellClass"
              >
                <span class="truncate text-muted">
                  {{ authorizer.autorizador }}
                </span>
              </td>
              <template
                v-for="monthKey in monthKeys"
                :key="`${row.compania}-${authorizer.autorizador}-${monthKey}`"
              >
                <td
                  class="px-2.5 py-1.5 text-right tabular-nums whitespace-nowrap text-muted"
                  :class="cellClass"
                >
                  {{ formatPendingInvoiceMoneyCompact(authorizer.meses[monthKey]?.monto ?? 0) }}
                </td>
                <td
                  class="px-2.5 py-1.5 text-right tabular-nums whitespace-nowrap text-dimmed"
                  :class="cellClass"
                >
                  {{ authorizer.meses[monthKey]?.eventos ?? '—' }}
                </td>
              </template>
              <td
                class="px-2.5 py-1.5 text-right tabular-nums whitespace-nowrap text-muted"
                :class="cellClass"
              >
                {{ formatPendingInvoiceMoney(authorizer.total) }}
              </td>
            </tr>
          </template>

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
      de antigüedad. Click en la compañía para verla en el tab Detalle.
    </p>
  </div>
</template>
