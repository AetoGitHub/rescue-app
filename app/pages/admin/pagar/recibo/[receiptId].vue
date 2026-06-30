<script setup lang="ts">
import { h, resolveComponent } from 'vue';
import type { TableColumn } from '@nuxt/ui';
import type { PaymentCheckoutDebtRow } from '~/interfaces/payment/checkout-debt';
import type { PaymentReceiptOperativeItem, PaymentReceiptSellerItem  } from '~/interfaces/payment/receipt';

import { adminListContainerClass } from '~/constants/admin-list-layout';

const receiptPanelUi = {
  body: 'flex min-h-0 flex-1 flex-col overflow-hidden',
} as const;

const UIcon = resolveComponent('UIcon');

const route = useRoute();

const receiptId = computed(() => {
  const raw = route.params.receiptId;
  const value = Array.isArray(raw) ? raw[0] : raw;
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
});

const { receipt, isLoading, errorMessage, refresh } = usePaymentReceipt(receiptId);

useHead({
  title: computed(() =>
    receiptId.value != null
      ? `Comprobante #${receiptId.value}`
      : 'Comprobante de pago',
  ),
});

const isOperativeReceipt = computed(
  () => receipt.value?.payment_type === 'operative',
);

const commissionRows = computed((): PaymentReceiptOperativeItem[] | PaymentReceiptSellerItem[] => {
  if (receipt.value == null) return [];
  return isOperativeReceipt.value
    ? receipt.value.operative
    : receipt.value.seller;
});

const debtRows = computed(() => receipt.value?.debt ?? []);

const commissionSubtotal = computed(() => {
  if (receipt.value == null) return 0;
  return computeReceiptCommissionSubtotal(
    receipt.value.operative,
    receipt.value.seller,
  );
});

const debtSubtotal = computed(() => computeReceiptDebtSubtotal(debtRows.value));

const totalPaid = computed(() =>
  receipt.value != null
    ? parseRescueCardMoney(receipt.value.total_amount)
    : 0,
);

const beneficiaryName = computed(() => {
  if (receipt.value == null) return '—';
  if (isOperativeReceipt.value) {
    return formatOptionalCell(receipt.value.operative[0]?.operator_name);
  }
  return formatOptionalCell(receipt.value.seller[0]?.seller_name);
});

const itemCountLabel = computed(() => {
  const count = commissionRows.value.length;
  return `${count} rescate${count === 1 ? '' : 's'} pagado${count === 1 ? '' : 's'}`;
});

function formatPaymentDate(iso: string | null | undefined): string {
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
  return value?.trim() ? value : '—';
}

const operativeColumns = computed(
  (): TableColumn<PaymentReceiptOperativeItem>[] => [
    {
      accessorKey: 'rescue_folio',
      header: 'Folio',
      cell: ({ row }) =>
        h('span', { class: 'font-medium' }, row.original.rescue_folio),
    },
    {
      id: 'date',
      header: 'Fecha',
      cell: ({ row }) =>
        h(
          'span',
          { class: 'text-muted' },
          formatPaymentDate(row.original.date_payment),
        ),
    },
    {
      id: 'penalty',
      header: '¿Penalizado?',
      cell: ({ row }) =>
        renderOperativePenaltyStatus(row.original, UIcon),
    },
    {
      id: 'amount',
      header: 'Cantidad',
      cell: ({ row }) =>
        renderOperativePenaltyAmount(
          row.original,
          row.original.penalty_forgiven,
        ),
      meta: {
        class: {
          th: 'text-right',
          td: 'text-right',
        },
      },
    },
  ],
);

const sellerColumns = computed(
  (): TableColumn<PaymentReceiptSellerItem>[] => [
    {
      accessorKey: 'rescue_folio',
      header: 'Folio',
      cell: ({ row }) =>
        h('span', { class: 'font-medium' }, row.original.rescue_folio),
    },
    {
      id: 'date',
      header: 'Fecha',
      cell: ({ row }) =>
        h(
          'span',
          { class: 'text-muted' },
          formatPaymentDate(row.original.date_payment),
        ),
    },
    {
      id: 'amount',
      header: 'Cantidad',
      cell: ({ row }) =>
        h(
          'span',
          { class: 'tabular-nums' },
          formatRescueCardMoney(row.original.amount),
        ),
      meta: {
        class: {
          th: 'text-right',
          td: 'text-right',
        },
      },
    },
  ],
);

const debtColumns = computed((): TableColumn<PaymentCheckoutDebtRow>[] => [
  {
    accessorKey: 'rescue_folio',
    header: 'Folio',
    cell: ({ row }) =>
      h('span', formatOptionalCell(row.original.rescue_folio)),
  },
  {
    id: 'date',
    header: 'Fecha',
    cell: ({ row }) =>
      h(
        'span',
        { class: 'text-muted' },
        formatPaymentDate(row.original.created_at),
      ),
  },
  {
    id: 'amount',
    header: 'Cantidad',
    cell: ({ row }) =>
      h(
        'span',
        { class: 'tabular-nums' },
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
  <UDashboardPanel :ui="receiptPanelUi">
    <template #header>
      <SharedNavbar title="Comprobante de pago" />
    </template>

    <template #body>
      <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div class="min-h-0 flex-1 overflow-y-auto">
          <UContainer :class="[adminListContainerClass, 'pb-6']">
            <div
              v-if="receiptId == null"
              class="flex flex-col items-center gap-4 py-16 text-center"
            >
              <p class="text-sm text-muted">
                El identificador del comprobante no es válido.
              </p>
              <UButton
                to="/admin/pagar"
                label="Volver a pagar"
                color="primary"
              />
            </div>

            <template v-else>
              <div class="flex shrink-0 flex-wrap items-center justify-between gap-3">
                <UButton
                  to="/admin/pagar/recibos"
                  icon="i-lucide-arrow-left"
                  label="Ver comprobantes"
                  color="neutral"
                  variant="ghost"
                />
              </div>

              <div class="space-y-1">
                <h1 class="text-3xl font-bold tracking-tight">
                  Comprobante de pago
                  <span
                    v-if="receipt"
                    class="text-muted"
                  >#{{ receipt.id }}</span>
                </h1>
                <p class="text-sm text-muted">
                  Resumen del pago registrado.
                </p>
              </div>

              <USeparator class="shrink-0" />

              <div
                v-if="isLoading"
                class="flex items-center justify-center py-16"
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
                title="No se pudo cargar el comprobante"
                :description="errorMessage"
              >
                <template #actions>
                  <UButton
                    label="Reintentar"
                    color="neutral"
                    variant="outline"
                    @click="() => void refresh()"
                  />
                  <UButton
                    to="/admin/pagar"
                    label="Volver a pagar"
                    color="primary"
                  />
                </template>
              </UAlert>

              <div
                v-else-if="receipt"
                class="flex flex-col gap-6"
              >
                <UPageCard class="flex flex-wrap items-center justify-between gap-4">
                  <div class="space-y-2">
                    <p
                      class="text-xs font-semibold uppercase tracking-wider text-muted"
                    >
                      Pagado a
                    </p>
                    <div class="flex flex-wrap items-center gap-2">
                      <UBadge
                        color="primary"
                        variant="subtle"
                      >
                        {{ paymentCheckoutRecipientLabel(receipt.payment_type) }}
                      </UBadge>
                      <p class="text-xl font-semibold tracking-tight">
                        {{ beneficiaryName }}
                      </p>
                    </div>
                    <p class="text-sm text-muted">
                      Registrado por {{ receipt.created_by }}
                      · {{ formatPaymentDate(receipt.created_at) }}
                    </p>
                  </div>
                </UPageCard>

                <UPageCard class="flex flex-col gap-3">
                  <div class="flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <p
                        class="text-xs font-semibold uppercase tracking-wider text-muted"
                      >
                        Total pagado
                      </p>
                      <p class="mt-1 text-3xl font-bold tabular-nums tracking-tight">
                        {{ formatRescueCardMoney(receipt.total_amount) }}
                      </p>
                    </div>
                    <p class="text-sm text-muted">
                      {{ itemCountLabel }}
                    </p>
                  </div>
                  <div
                    class="grid gap-1 text-sm text-muted"
                    :class="debtRows.length > 0 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'"
                  >
                    <p>
                      Comisiones:
                      <span class="tabular-nums text-default">
                        {{ formatRescueCardMoney(commissionSubtotal) }}
                      </span>
                    </p>
                    <p v-if="debtRows.length > 0">
                      Deudas:
                      <span class="tabular-nums text-default">
                        −{{ formatRescueCardMoney(debtSubtotal) }}
                      </span>
                    </p>
                    <p>
                      Neto:
                      <span class="tabular-nums font-medium text-default">
                        {{ formatRescueCardMoney(totalPaid) }}
                      </span>
                    </p>
                  </div>
                </UPageCard>

                <section v-if="commissionRows.length > 0">
                  <h2 class="mb-3 text-lg font-semibold">
                    Comisiones
                  </h2>
                  <div class="overflow-hidden rounded-lg border border-default">
                    <UTable
                      v-if="isOperativeReceipt"
                      class="w-full"
                      :columns="operativeColumns"
                      :data="receipt.operative"
                      :get-row-id="(row: PaymentReceiptOperativeItem) => String(row.id)"
                    />
                    <UTable
                      v-else
                      class="w-full"
                      :columns="sellerColumns"
                      :data="receipt.seller"
                      :get-row-id="(row: PaymentReceiptSellerItem) => String(row.id)"
                    />
                    <div
                      class="flex flex-wrap items-center justify-between gap-2 border-t border-default px-4 py-3 text-sm"
                    >
                      <span class="font-semibold">Subtotal</span>
                      <span class="tabular-nums font-semibold">
                        {{ formatRescueCardMoney(commissionSubtotal) }}
                      </span>
                    </div>
                  </div>
                </section>

                <section
                  v-if="debtRows.length > 0"
                  class="space-y-3"
                >
                  <h2 class="text-lg font-semibold">
                    Deudas aplicadas
                  </h2>
                  <div class="overflow-hidden rounded-lg border border-default">
                    <UTable
                      class="w-full"
                      :columns="debtColumns"
                      :data="debtRows"
                      :get-row-id="(row: PaymentCheckoutDebtRow) => String(row.id)"
                    />
                    <div
                      class="flex flex-wrap items-center justify-between gap-2 border-t border-default px-4 py-3 text-sm"
                    >
                      <span class="font-semibold">Subtotal</span>
                      <span class="tabular-nums font-semibold">
                        −{{ formatRescueCardMoney(debtSubtotal) }}
                      </span>
                    </div>
                  </div>
                </section>
              </div>
            </template>
          </UContainer>
        </div>

        <div
          v-if="receipt && !isLoading && !errorMessage"
          class="shrink-0 border-t border-default bg-default"
        >
          <UContainer class="flex justify-end gap-2 py-4">
            <UButton
              to="/admin/pagar"
              label="Volver a pagar"
              color="primary"
              icon="i-lucide-arrow-left"
            />
          </UContainer>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
