<script setup lang="ts">
import { PENDING_INVOICE_MATRIX_WINDOW_OPTIONS } from '~/constants/pending-invoice-api';
import type { PendingInvoiceCompanyMatrixRow } from '~/interfaces/invoicing/pending-invoice';
import {
  daysSemaphoreColor,
  formatMatrixMonthLabel,
  matrixCellAgeClass,
} from '~/utils/pending-invoice-display';

defineProps<{
  rows: PendingInvoiceCompanyMatrixRow[];
  monthKeys: string[];
  matrixSummary: {
    companies: number;
    events: number;
    totalConIva: number;
  };
  footerTotals: {
    byMonth: Record<string, { monto: number; eventos: number }>;
    grandTotal: number;
    grandEvents: number;
  };
  loading?: boolean;
}>();

const emit = defineEmits<{
  selectCompany: [compania: string];
}>();

const monthsModel = defineModel<number>('months', { required: true });
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <span class="text-sm text-muted">Ventana:</span>
        <USelect
          v-model="monthsModel"
          :items="[...PENDING_INVOICE_MATRIX_WINDOW_OPTIONS]"
          value-key="value"
          label-key="label"
          class="min-w-44"
          variant="subtle"
          :ui="{ base: 'bg-default' }"
        />
      </div>
      <p class="text-sm text-muted">
        {{ matrixSummary.companies }} compañías ·
        {{ matrixSummary.events }} eventos ·
        {{ formatRescueCardMoney(matrixSummary.totalConIva) }} c/IVA
      </p>
    </div>

    <div class="overflow-x-auto">
      <table class="min-w-full border-collapse text-sm">
        <thead>
          <tr class="bg-primary text-left text-xs font-semibold uppercase tracking-wider text-inverted">
            <th
              class="sticky left-0 z-10 bg-primary px-3 py-2"
              rowspan="2"
            >
              Compañía
            </th>
            <th
              class="bg-primary px-3 py-2"
              rowspan="2"
            >
              Responsable
            </th>
            <th
              v-for="monthKey in monthKeys"
              :key="monthKey"
              class="px-3 py-2 text-center whitespace-nowrap"
              colspan="2"
            >
              {{ formatMatrixMonthLabel(monthKey) }}
            </th>
            <th
              class="px-3 py-2 whitespace-nowrap"
              rowspan="2"
            >
              Total
            </th>
            <th
              class="px-3 py-2 whitespace-nowrap"
              rowspan="2"
            >
              Días máx.
            </th>
          </tr>
          <tr class="bg-primary text-xs text-inverted/90">
            <template
              v-for="monthKey in monthKeys"
              :key="`${monthKey}-sub`"
            >
              <th class="px-3 py-1 text-center font-medium">
                $
              </th>
              <th class="px-3 py-1 text-center font-medium">
                #
              </th>
            </template>
          </tr>
        </thead>
        <tbody>
          <tr
            v-if="loading"
            class="border-b border-default"
          >
            <td
              :colspan="monthKeys.length * 2 + 4"
              class="px-3 py-8 text-center text-muted"
            >
              <UIcon name="i-lucide-loader-circle" class="mr-2 inline size-4 animate-spin" />
              Cargando matriz…
            </td>
          </tr>
          <tr
            v-for="row in rows"
            v-else
            :key="row.compania"
            class="border-b border-default hover:bg-elevated/50"
          >
            <td class="sticky left-0 z-10 bg-default px-3 py-2 font-medium">
              <button
                type="button"
                class="text-left text-primary hover:underline"
                @click="emit('selectCompany', row.compania)"
              >
                {{ row.compania }}
              </button>
            </td>
            <td class="px-3 py-2">
              {{ row.responsable?.trim() || '—' }}
            </td>
            <template
              v-for="monthKey in monthKeys"
              :key="`${row.compania}-${monthKey}`"
            >
              <td
                class="px-3 py-2 text-right tabular-nums whitespace-nowrap"
                :class="matrixCellAgeClass(monthKey)"
              >
                <template v-if="row.meses[monthKey]">
                  <span class="text-error">
                    {{ formatRescueCardMoney(row.meses[monthKey].monto) }}
                  </span>
                </template>
                <span v-else class="text-muted">—</span>
              </td>
              <td
                class="px-3 py-2 text-right tabular-nums whitespace-nowrap text-muted text-xs"
                :class="matrixCellAgeClass(monthKey)"
              >
                <template v-if="row.meses[monthKey]">
                  {{ row.meses[monthKey].eventos }}
                </template>
                <span v-else>—</span>
              </td>
            </template>
            <td class="px-3 py-2 tabular-nums font-medium">
              {{ formatRescueCardMoney(row.total) }}
            </td>
            <td class="px-3 py-2">
              <UBadge
                :color="daysSemaphoreColor(row.dias_max)"
                variant="subtle"
                size="sm"
                class="rounded-full"
                :label="String(row.dias_max)"
              />
            </td>
          </tr>
          <tr
            v-if="!loading && rows.length > 0"
            class="border-t-2 border-default bg-elevated/30 font-semibold"
          >
            <td class="sticky left-0 z-10 bg-elevated/30 px-3 py-2">
              Totales
            </td>
            <td class="px-3 py-2 text-muted">
              —
            </td>
            <template
              v-for="monthKey in monthKeys"
              :key="`total-${monthKey}`"
            >
              <td class="px-3 py-2 text-right tabular-nums whitespace-nowrap">
                <template v-if="footerTotals.byMonth[monthKey]">
                  {{ formatRescueCardMoney(footerTotals.byMonth[monthKey].monto) }}
                </template>
                <span v-else class="text-muted">—</span>
              </td>
              <td class="px-3 py-2 text-right tabular-nums whitespace-nowrap text-muted text-xs">
                <template v-if="footerTotals.byMonth[monthKey]">
                  {{ footerTotals.byMonth[monthKey].eventos }}
                </template>
                <span v-else>—</span>
              </td>
            </template>
            <td class="px-3 py-2 tabular-nums">
              {{ formatRescueCardMoney(footerTotals.grandTotal) }}
            </td>
            <td class="px-3 py-2 text-muted">
              —
            </td>
          </tr>
          <tr v-if="!loading && rows.length === 0">
            <td
              :colspan="monthKeys.length * 2 + 4"
              class="px-3 py-8 text-center text-muted"
            >
              No hay pendientes por facturar.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
