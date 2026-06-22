<script setup lang="ts">
import { h, resolveComponent } from 'vue';
import type { TableColumn } from '@nuxt/ui';
import type { BalanceProfile } from '~/constants/payment-api';
import type { OperativeBalanceVoucher } from '~/interfaces/payment/balance-operative';
import type { BalanceVoucher } from '~/interfaces/payment/balance';
import { adminListTableClass } from '~/constants/admin-list-layout';
import { parsePositiveIntQuery } from '~~/shared/utils/payment-balance-query';

useHead({
  title: 'Mi saldo',
});

const isDev = import.meta.dev;
const testDaysInput = ref<number | null>(null);
const appliedTestDays = ref<number | null>(null);

const UBadge = resolveComponent('UBadge');
const UIcon = resolveComponent('UIcon');

const {
  vouchers,
  total,
  isPending,
  hasBalanceProfile,
  balanceProfile,
  errorMessage,
  testDays,
} = useMyBalance(undefined, appliedTestDays);

const isOperativeProfile = computed(() => balanceProfile.value === 'operative');

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

function formatPenaltyPercent(value: string | null | undefined): string {
  const parsed = parseRescueCardMoney(value);
  if (parsed === 0) return '—';
  const percent = parsed <= 1 ? parsed * 100 : parsed;
  return `${percent.toFixed(0)}%`;
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

function renderCommissionAmount(voucher: OperativeBalanceVoucher) {
  if (!voucher.is_penalty) {
    return h(
      'span',
      { class: 'tabular-nums' },
      formatRescueCardMoney(voucher.amount),
    );
  }

  return h('div', { class: 'flex flex-col items-start gap-0.5' }, [
    h(
      'span',
      { class: 'tabular-nums text-sm text-error line-through' },
      formatRescueCardMoney(voucher.amount),
    ),
    h(
      'span',
      { class: 'tabular-nums font-medium' },
      formatRescueCardMoney(voucher.penalty_amount),
    ),
  ]);
}

const voucherCountLabel = computed(() => {
  const count = vouchers.value.length;
  return `${count} voucher${count === 1 ? '' : 's'} pendiente${count === 1 ? '' : 's'}`;
});

const sharedColumns = (
  profile: BalanceProfile,
): TableColumn<BalanceVoucher>[] => [
  {
    accessorKey: 'rescue_folio',
    header: 'Folio',
    cell: ({ row }) =>
      h('span', { class: 'font-medium' }, row.original.rescue_folio),
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
        return renderCommissionAmount(row.original as OperativeBalanceVoucher);
      }
      return h(
        'span',
        { class: 'tabular-nums' },
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

function renderPenaltyStatus(voucher: OperativeBalanceVoucher) {
  if (!voucher.is_penalty) {
    return h('div', { class: 'flex items-center gap-2' }, [
      h(UIcon, {
        name: 'i-lucide-check',
        class: 'size-4 text-success shrink-0',
      }),
      h('span', { class: 'text-sm text-muted' }, 'No'),
    ]);
  }

  return h('div', { class: 'flex flex-col gap-0.5' }, [
    h('div', { class: 'flex items-center gap-2' }, [
      h(UIcon, {
        name: 'i-lucide-x',
        class: 'size-4 text-error shrink-0',
      }),
      h('span', { class: 'text-sm font-medium text-error' }, 'Sí'),
    ]),
    h(
      'span',
      { class: 'text-xs tabular-nums text-muted' },
      formatPenaltyPercent(voucher.penalty_applied),
    ),
  ]);
}

const operativePenaltyColumn: TableColumn<BalanceVoucher> = {
  id: 'penalty',
  header: '¿Penalizado?',
  cell: ({ row }) =>
    renderPenaltyStatus(row.original as OperativeBalanceVoucher),
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
</script>

<template>
  <AdminListPageShell
    navbar-title="Mi saldo"
    title="Mi saldo"
    description="Vouchers pendientes de pago y comisiones acumuladas"
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
        :loading="isPending"
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
      v-else-if="isPending"
      class="flex flex-1 items-center justify-center py-16"
    >
      <UIcon
        name="i-lucide-loader-circle"
        class="size-8 animate-spin text-muted"
      />
    </div>

    <UAlert
      v-else-if="errorMessage"
      color="error"
      variant="subtle"
      icon="i-lucide-circle-alert"
      title="No se pudo cargar el saldo"
      :description="errorMessage"
    />

    <div v-else class="flex min-h-0 flex-1 flex-col gap-4">
      <UPageCard class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-muted">
            Total a pagar
          </p>
          <p class="mt-1 text-3xl font-bold tabular-nums tracking-tight">
            {{ formatRescueCardMoney(total) }}
          </p>
        </div>
        <p class="text-sm text-muted">
          {{ voucherCountLabel }}
        </p>
      </UPageCard>

      <UAlert
        v-if="testDays != null && isOperativeProfile"
        color="warning"
        variant="subtle"
        icon="i-lucide-flask-conical"
        title="Modo prueba (dev)"
        :description="`Simulando ${testDays} día${testDays === 1 ? '' : 's'} de penalización.`"
      />

      <div
        v-if="vouchers.length === 0"
        class="flex flex-1 items-center justify-center rounded-lg border border-dashed border-default py-16 text-center text-sm text-muted"
      >
        No tienes vouchers pendientes de pago.
      </div>

      <UTable
        v-else
        sticky
        :class="adminListTableClass"
        :columns="columns"
        :data="vouchers"
        :get-row-id="(row: BalanceVoucher) => String(row.id)"
      />
    </div>
  </AdminListPageShell>
</template>
