<script setup lang="ts">
import { h, resolveComponent } from 'vue';
import type { TableColumn } from '@nuxt/ui';
import {
  PAYMENT_DEBT_SOURCE_OPTIONS,
  type BalanceProfile,
  type PaymentDebtSource,
} from '~/constants/payment-api';
import type { OperativeBalanceVoucher } from '~/interfaces/payment/balance-operative';
import type { BalanceVoucher } from '~/interfaces/payment/balance';
import type { PaymentDebtItem } from '~/interfaces/payment/debt';
import { adminListTableClass } from '~/constants/admin-list-layout';
import { parsePositiveIntQuery } from '~~/shared/utils/payment-balance-query';
import {
  renderOperativePenaltyAmount,
  renderOperativePenaltyStatus,
} from '~/utils/payment-penalty-display';

useHead({
  title: 'Mi saldo',
});

const isDev = import.meta.dev;
const testDaysInput = ref<number | null>(null);
const appliedTestDays = ref<number | null>(null);

const UBadge = resolveComponent('UBadge');
const UIcon = resolveComponent('UIcon');

const { user } = useUserSession();

const {
  vouchers,
  isPending: isBalancePending,
  hasBalanceProfile,
  balanceProfile,
  errorMessage: balanceErrorMessage,
  testDays,
} = useMyBalance(undefined, appliedTestDays);

const {
  rows: debtRows,
  isInitialLoading: isDebtsPending,
  errorMessage: debtsErrorMessage,
} = usePaymentDebtList(
  computed(() => user.value?.id),
  { payment: false },
);

const isOperativeProfile = computed(() => balanceProfile.value === 'operative');

const commissionSubtotal = computed(() => {
  const profile = balanceProfile.value;
  if (profile == null) return 0;
  return computeBalanceCommissionSubtotal(vouchers.value, profile);
});

const debtSubtotal = computed(() => computeBalanceDebtSubtotal(debtRows.value));

const grandTotal = computed(() => {
  const profile = balanceProfile.value;
  if (profile == null) return 0;
  return computeBalanceGrandTotal(vouchers.value, debtRows.value, profile);
});

const hasAnyBalanceItems = computed(
  () => vouchers.value.length > 0 || debtRows.value.length > 0,
);

function applyTestDaysSimulation() {
  appliedTestDays.value = parsePositiveIntQuery(testDaysInput.value?.toString().trim());
}

function clearTestDaysSimulation() {
  testDaysInput.value = null;
  appliedTestDays.value = null;
}

function formatCommissionPercent(value: string | null | undefined): string {
  const parsed = parseRescueCardMoney(value);
  if (parsed === 0) return '0%';
  return `${parsed % 1 === 0 ? parsed.toFixed(0) : parsed.toFixed(2).replace(/\.?0+$/, '')}%`;
}

function formatVoucherDate(iso: string | null | undefined): string {
  if (!iso?.trim()) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatOptionalCell(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : '—';
}

function paymentDebtSourceLabel(source: PaymentDebtSource): string {
  return (
    PAYMENT_DEBT_SOURCE_OPTIONS.find((option) => option.value === source)?.label
    ?? source
  );
}

const balanceSummaryLabel = computed(() => {
  const voucherCount = vouchers.value.length;
  const debtCount = debtRows.value.length;
  const parts: string[] = [];

  if (voucherCount > 0) {
    parts.push(
      `${voucherCount} voucher${voucherCount === 1 ? '' : 's'} pendiente${voucherCount === 1 ? '' : 's'}`,
    );
  }

  if (debtCount > 0) {
    parts.push(
      `${debtCount} deuda${debtCount === 1 ? '' : 's'} pendiente${debtCount === 1 ? '' : 's'}`,
    );
  }

  return parts.join(' · ');
});

const sharedColumns = (
  profile: BalanceProfile,
): TableColumn<BalanceVoucher>[] => [
  {
    accessorKey: 'rescue_folio',
    header: 'Folio',
    cell: ({ row }) =>
      h(
        'span',
        { class: 'font-medium text-primary' },
        row.original.rescue_folio,
      ),
  },
  {
    id: 'operative_status',
    header: 'Estado operativo',
    cell: ({ row }) =>
      getAdministrativeOperativeStatusLabel(
        row.original.rescue_operative_status,
      ),
  },
  {
    id: 'admin_status',
    header: 'Estado admin',
    cell: ({ row }) => {
      const badge = getBillingStatusBadge(row.original.rescue_admin_status);
      return h(UBadge, {
        color: badge.color,
        variant: 'subtle',
        size: 'sm',
        label: badge.label,
      });
    },
  },
  {
    id: 'commission',
    header: profile === 'operative' ? 'Comisión operador' : 'Comisión',
    cell: ({ row }) =>
      h(
        'span',
        { class: 'tabular-nums' },
        formatCommissionPercent(row.original.operator_commission),
      ),
  },
  {
    id: 'amount',
    header: 'Monto comisión',
    cell: ({ row }) => {
      if (profile === 'operative') {
        return renderOperativePenaltyAmount(
          row.original as OperativeBalanceVoucher,
          false,
        );
      }
      return h(
        'span',
        { class: 'tabular-nums text-primary' },
        formatRescueCardMoney(row.original.amount),
      );
    },
  },
  {
    id: 'created_at',
    header: 'Fecha',
    cell: ({ row }) =>
      h(
        'span',
        { class: 'text-muted' },
        formatVoucherDate(row.original.created_at),
      ),
  },
];

const operativePenaltyColumn: TableColumn<BalanceVoucher> = {
  id: 'penalty',
  header: '¿Penalizado?',
  cell: ({ row }) =>
    renderOperativePenaltyStatus(
      row.original as OperativeBalanceVoucher,
      UIcon,
    ),
};

const columns = computed((): TableColumn<BalanceVoucher>[] => {
  const profile = balanceProfile.value;
  if (profile == null) return [];

  const base = sharedColumns(profile);
  if (!isOperativeProfile.value) {
    return base;
  }

  const amountIndex = base.findIndex((column) => column.id === 'amount');
  if (amountIndex === -1) {
    return [...base, operativePenaltyColumn];
  }

  return [
    ...base.slice(0, amountIndex + 1),
    operativePenaltyColumn,
    ...base.slice(amountIndex + 1),
  ];
});

const debtColumns = computed((): TableColumn<PaymentDebtItem>[] => [
  {
    accessorKey: 'rescue_folio',
    header: 'Folio',
    cell: ({ row }) =>
      h('span', formatOptionalCell(row.original.rescue_folio)),
  },
  {
    id: 'source',
    header: 'Origen',
    cell: ({ row }) =>
      h('span', paymentDebtSourceLabel(row.original.source)),
  },
  {
    id: 'created_at',
    header: 'Fecha',
    cell: ({ row }) =>
      h(
        'span',
        { class: 'text-muted' },
        formatVoucherDate(row.original.created_at),
      ),
  },
  {
    id: 'amount',
    header: 'Cantidad',
    cell: ({ row }) =>
      h(
        'span',
        { class: 'tabular-nums text-error' },
        formatRescueCardMoney(row.original.amount),
      ),
    meta: {
      class: {
        th: 'text-right',
        td: 'text-right',
      },
    },
  },
]);
</script>

<template>
  <AdminListPageShell
    navbar-title="Mi saldo"
    title="Mi saldo"
    description="Vouchers pendientes de pago, deudas y comisiones acumuladas"
  >
    <UPageCard
      v-if="isDev && hasBalanceProfile && isOperativeProfile"
      variant="subtle"
      :ui="{ body: 'flex flex-wrap items-end gap-3' }"
      class="mb-4"
    >
      <div class="min-w-40 flex-1">
        <p
          class="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted"
        >
          Simular días de penalización (dev)
        </p>
        <UInputNumber
          v-model="testDaysInput"
          inputmode="numeric"
          placeholder="Ej. 8"
          class="w-full"
          @keyup.enter="applyTestDaysSimulation"
        />
      </div>
      <UButton
        color="primary"
        icon="i-lucide-flask-conical"
        label="Simular"
        :loading="isBalancePending"
        @click="applyTestDaysSimulation"
      />
      <UButton
        v-if="appliedTestDays != null"
        color="neutral"
        variant="ghost"
        label="Quitar simulación"
        @click="clearTestDaysSimulation"
      />
    </UPageCard>

    <div
      v-if="!hasBalanceProfile"
      class="flex flex-1 items-center justify-center py-16"
    >
      <UPageCard class="max-w-md text-center">
        <p class="font-medium">Saldo no disponible</p>
        <p class="mt-1 text-sm text-muted">
          Tu rol no tiene comisiones pendientes de pago en esta pantalla.
        </p>
      </UPageCard>
    </div>

    <div
      v-else-if="isBalancePending"
      class="flex flex-1 items-center justify-center py-16"
    >
      <UIcon
        name="i-lucide-loader-circle"
        class="size-8 animate-spin text-muted"
      />
    </div>

    <UAlert
      v-else-if="balanceErrorMessage"
      color="error"
      variant="subtle"
      icon="i-lucide-circle-alert"
      title="No se pudo cargar el saldo"
      :description="balanceErrorMessage"
    />

    <div v-else class="flex min-h-0 flex-1 flex-col gap-4">
      <UPageCard class="flex flex-col gap-3">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider text-muted">
              Total a pagar
            </p>
            <p class="mt-1 text-3xl font-bold tabular-nums tracking-tight">
              {{ formatRescueCardMoney(grandTotal) }}
            </p>
          </div>
          <p
            v-if="balanceSummaryLabel"
            class="text-sm text-muted"
          >
            {{ balanceSummaryLabel }}
          </p>
        </div>
        <div class="grid gap-1 text-sm text-muted sm:grid-cols-3">
          <p>
            Comisiones:
            <span class="tabular-nums text-default">
              {{ formatRescueCardMoney(commissionSubtotal) }}
            </span>
          </p>
          <p>
            Deudas:
            <span class="tabular-nums text-error">
              −{{ formatRescueCardMoney(debtSubtotal) }}
            </span>
          </p>
          <p>
            Neto:
            <span class="tabular-nums font-medium text-default">
              {{ formatRescueCardMoney(grandTotal) }}
            </span>
          </p>
        </div>
      </UPageCard>

      <UAlert
        v-if="testDays != null && isOperativeProfile"
        color="warning"
        variant="subtle"
        icon="i-lucide-flask-conical"
        title="Modo prueba (dev)"
        :description="`Simulando ${testDays} día${testDays === 1 ? '' : 's'} de penalización.`"
      />

      <UAlert
        v-if="debtsErrorMessage"
        color="warning"
        variant="subtle"
        icon="i-lucide-triangle-alert"
        title="No se pudieron cargar las deudas"
        :description="debtsErrorMessage"
      />

      <div
        v-if="!hasAnyBalanceItems && !isDebtsPending"
        class="flex flex-1 items-center justify-center rounded-lg border border-dashed border-default py-16 text-center text-sm text-muted"
      >
        No tienes comisiones ni deudas pendientes de pago.
      </div>

      <section v-if="vouchers.length > 0" class="space-y-3">
        <h2 class="text-lg font-semibold">
          Comisiones
        </h2>
        <UTable
          sticky
          :class="adminListTableClass"
          :columns="columns"
          :data="vouchers"
          :get-row-id="(row: BalanceVoucher) => String(row.id)"
        />
      </section>

      <section class="space-y-3">
        <h2 class="text-lg font-semibold">
          Deudas pendientes
        </h2>

        <div
          v-if="isDebtsPending"
          class="flex items-center justify-center rounded-lg border border-dashed border-default py-12"
        >
          <UIcon
            name="i-lucide-loader-circle"
            class="size-6 animate-spin text-muted"
          />
        </div>

        <div
          v-else
          class="overflow-hidden rounded-lg border border-default"
        >
          <UTable
            class="w-full"
            :columns="debtColumns"
            :data="debtRows"
            :get-row-id="(row: PaymentDebtItem) => String(row.id)"
          >
            <template #empty>
              <div class="py-8 text-center text-sm text-muted">
                Sin deudas pendientes
              </div>
            </template>
          </UTable>
          <div
            v-if="debtRows.length > 0"
            class="grid grid-cols-4 border-t border-default px-4 py-3 text-sm"
          >
            <div class="col-span-3 text-center font-semibold">
              Subtotal
            </div>
            <div class="text-right tabular-nums font-semibold text-error">
              −{{ formatRescueCardMoney(debtSubtotal) }}
            </div>
          </div>
        </div>
      </section>
    </div>
  </AdminListPageShell>
</template>
