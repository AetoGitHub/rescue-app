<script setup lang="ts">
import { h, resolveComponent } from 'vue';
import type { TableColumn } from '@nuxt/ui';
import type { PaymentCheckoutDebtRow } from '~/interfaces/payment/checkout-debt';
import type { PaymentCartCheckoutRow } from '~/utils/payment-cart-display';
import { adminListContainerClass } from '~/constants/admin-list-layout';

const checkoutPanelUi = {
  body: 'flex min-h-0 flex-1 flex-col overflow-hidden',
} as const;

const UIcon = resolveComponent('UIcon');
const UTooltip = resolveComponent('UTooltip');

useHead({
  title: 'Checkout de pago',
});

const toast = useToast();

const { cart, isLoading, errorMessage, refresh } = usePaymentCart();
const { recipient, syncRecipientUserName } = usePaymentCheckoutRecipient();

onMounted(() => {
  void refresh();
});

const cartRecipientSummary = computed(() =>
  cart.value != null ? resolvePaymentCartRecipientSummary(cart.value) : null,
);

const isInvalidCart = computed(() => {
  if (cart.value == null) return false;
  const active = resolveActivePaymentCart(cart.value);
  return active != null && isInvalidPaymentCart(active);
});

const activeRecipientType = computed(
  () => recipient.value?.type ?? cartRecipientSummary.value?.type ?? null,
);

const checkoutRecipient = computed(() => {
  if (activeRecipientType.value == null) return null;

  const userName =
    recipient.value?.userName
    ?? cartRecipientSummary.value?.userName
    ?? paymentCheckoutRecipientLabel(activeRecipientType.value);

  return {
    type: activeRecipientType.value,
    userId: recipient.value?.userId ?? null,
    userName,
    profileLabel: paymentCheckoutRecipientLabel(activeRecipientType.value),
  };
});

watch(cartRecipientSummary, (summary) => {
  if (summary != null) {
    syncRecipientUserName(summary.userName);
  }
});

const cartRows = computed((): PaymentCartCheckoutRow[] =>
  cart.value != null ? flattenPaymentCartItems(cart.value) : [],
);

const grandTotal = computed(() =>
  cart.value != null ? paymentCartGrandTotal(cart.value) : 0,
);

const itemCount = computed(() =>
  cart.value != null ? paymentCartItemCount(cart.value) : 0,
);

const hasCartItems = computed(
  () =>
    cart.value != null
    && paymentCartItemCount(cart.value) > 0
    && !isInvalidCart.value
    && activeRecipientType.value != null,
);

const missingRecipientUser = computed(
  () => hasCartItems.value && checkoutRecipient.value?.userId == null,
);

const emptyCartRedirected = ref(false);

watch(
  [cart, isLoading, errorMessage],
  () => {
    if (isLoading.value || errorMessage.value || emptyCartRedirected.value) {
      return;
    }

    if (cart.value != null && paymentCartItemCount(cart.value) === 0) {
      emptyCartRedirected.value = true;
      toast.add({
        title: 'Carrito vacío',
        description: 'Agrega deudas al carrito antes de proceder con el pago.',
        color: 'warning',
      });
      void navigateTo('/admin/pagar');
    }
  },
  { immediate: true },
);

const debtRows = ref<PaymentCheckoutDebtRow[]>([]);

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

function recipientTypeLabel(
  type: PaymentCartCheckoutRow['recipientType'],
): string {
  return paymentCheckoutRecipientLabel(type);
}

function recipientName(row: PaymentCartCheckoutRow): string {
  if (row.recipientType === 'operative') {
    return formatOptionalCell(row.operator_name);
  }
  return formatOptionalCell(row.seller_name ?? row.operator_name);
}

function rescueRowDate(row: PaymentCartCheckoutRow): string {
  return formatPaymentDate(row.debt_created_at ?? row.created_at);
}

function sumRowAmounts<T extends { amount: string }>(rows: T[]): number {
  return rows.reduce((sum, row) => sum + parseRescueCardMoney(row.amount), 0);
}

const rescueSubtotal = computed(() => sumRowAmounts(cartRows.value));
const debtSubtotal = computed(() => sumRowAmounts(debtRows.value));

function onAddDebt() {
  toast.add({
    title: 'Próximamente',
    description: 'Agregar deuda estará disponible pronto.',
    color: 'info',
  });
}

function onCancel() {
  void navigateTo('/admin/pagar');
}

function onPay() {
  toast.add({
    title: 'Próximamente',
    description: 'El flujo de pago estará disponible pronto.',
    color: 'info',
  });
}

const rescueColumns = computed((): TableColumn<PaymentCartCheckoutRow>[] => [
  {
    id: 'rescue',
    header: 'Rescate',
    cell: ({ row }) => {
      const tooltipParts = [
        recipientTypeLabel(row.original.recipientType),
        recipientName(row.original),
      ];
      if (row.original.client_name?.trim()) {
        tooltipParts.push(row.original.client_name.trim());
      }

      return h(
        UTooltip,
        { text: tooltipParts.join(' · ') },
        () =>
          h(UIcon, {
            name: 'i-lucide-info',
            class: 'size-4 text-muted',
          }),
      );
    },
    meta: {
      class: {
        th: 'w-16 text-center',
        td: 'w-16 text-center',
      },
    },
  },
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
      h('span', { class: 'text-muted' }, rescueRowDate(row.original)),
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

const debtColumns = computed((): TableColumn<PaymentCheckoutDebtRow>[] => [
  {
    id: 'actions',
    header: 'Acciones',
    cell: () => h('span', { class: 'text-muted' }, '—'),
    meta: {
      class: {
        th: 'w-28',
        td: 'w-28',
      },
    },
  },
  {
    accessorKey: 'folio',
    header: 'Folio',
    cell: ({ row }) => h('span', row.original.folio),
  },
  {
    id: 'date',
    header: 'Fecha',
    cell: ({ row }) =>
      h('span', { class: 'text-muted' }, formatPaymentDate(row.original.date)),
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

const itemCountLabel = computed(() => {
  const count = itemCount.value;
  return `${count} rescate${count === 1 ? '' : 's'} a pagar`;
});
</script>

<template>
  <UDashboardPanel :ui="checkoutPanelUi">
    <template #header>
      <SharedNavbar title="Checkout de pago" />
    </template>

    <template #body>
      <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div class="min-h-0 flex-1 overflow-y-auto">
          <UContainer :class="[adminListContainerClass, 'pb-6']">
            <div class="flex shrink-0 flex-wrap items-center justify-between gap-3">
              <UButton
                to="/admin/pagar"
                icon="i-lucide-arrow-left"
                label="Volver a pagar"
                color="neutral"
                variant="ghost"
              />
            </div>

            <div class="space-y-1">
              <h1 class="text-3xl font-bold tracking-tight">Checkout de pago</h1>
              <p class="text-sm text-muted">
                Revisa los rescates del carrito y confirma el pago.
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
              title="No se pudo cargar el carrito"
              :description="errorMessage"
            />

            <UAlert
              v-else-if="isInvalidCart"
              color="error"
              variant="subtle"
              icon="i-lucide-circle-alert"
              title="Respuesta inválida del carrito"
              description="El carrito devolvió operadores y vendedores a la vez. Vacía el carrito en Pagar e inténtalo de nuevo."
            />

            <div
              v-else-if="hasCartItems"
              class="flex flex-col gap-6"
            >
              <UPageCard class="flex flex-wrap items-center justify-between gap-4">
                <div class="space-y-2">
                  <p
                    class="text-xs font-semibold uppercase tracking-wider text-muted"
                  >
                    Pagando a
                  </p>
                  <div class="flex flex-wrap items-center gap-2">
                    <UBadge color="primary" variant="subtle">
                      {{ checkoutRecipient?.profileLabel }}
                    </UBadge>
                    <p class="text-xl font-semibold tracking-tight">
                      {{ checkoutRecipient?.userName }}
                    </p>
                  </div>
                </div>
              </UPageCard>

              <UAlert
                v-if="missingRecipientUser"
                color="warning"
                variant="subtle"
                icon="i-lucide-triangle-alert"
                title="Usuario de pago no identificado"
                description="Regresa a Pagar y vuelve a agregar las deudas seleccionando el operador o vendedor."
              />

              <UPageCard class="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p
                    class="text-xs font-semibold uppercase tracking-wider text-muted"
                  >
                    Total a pagar
                  </p>
                  <p class="mt-1 text-3xl font-bold tabular-nums tracking-tight">
                    {{ formatRescueCardMoney(grandTotal) }}
                  </p>
                </div>
                <p class="text-sm text-muted">
                  {{ itemCountLabel }}
                </p>
              </UPageCard>

              <section>
                <div class="overflow-hidden rounded-lg border border-default">
                  <UTable
                    class="w-full"
                    :columns="rescueColumns"
                    :data="cartRows"
                    :get-row-id="
                      (row: PaymentCartCheckoutRow) =>
                        `${row.recipientType}-${row.id}`
                    "
                  />
                  <div
                    class="grid grid-cols-4 border-t border-default px-4 py-3 text-sm"
                  >
                    <div />
                    <div class="col-span-2 text-center font-semibold">
                      Subtotal
                    </div>
                    <div class="text-right tabular-nums font-semibold">
                      {{ formatRescueCardMoney(rescueSubtotal) }}
                    </div>
                  </div>
                </div>
              </section>

              <section class="space-y-3">
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <h2 class="text-lg font-semibold">
                    Deudas en el momento
                  </h2>
                  <UButton
                    label="Agregar deuda"
                    icon="i-lucide-plus"
                    color="neutral"
                    variant="outline"
                    @click="onAddDebt"
                  />
                </div>

                <div class="overflow-hidden rounded-lg border border-default">
                  <UTable
                    class="w-full"
                    :columns="debtColumns"
                    :data="debtRows"
                    :get-row-id="(row: PaymentCheckoutDebtRow) => row.id"
                  >
                    <template #empty>
                      <div class="py-8 text-center text-sm text-muted">
                        Sin datos
                      </div>
                    </template>
                  </UTable>
                  <div
                    class="grid grid-cols-4 border-t border-default px-4 py-3 text-sm"
                  >
                    <div />
                    <div />
                    <div class="text-center font-semibold">
                      Subtotal
                    </div>
                    <div class="text-right tabular-nums font-semibold">
                      {{ formatRescueCardMoney(debtSubtotal) }}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </UContainer>
        </div>

        <div
          v-if="hasCartItems && !isLoading && !errorMessage"
          class="shrink-0 border-t border-default bg-default"
        >
          <UContainer class="flex justify-end gap-2 py-4">
            <UButton
              label="Cancelar"
              color="neutral"
              variant="outline"
              @click="onCancel"
            />
            <UButton
              label="Pagar"
              color="primary"
              icon="i-lucide-credit-card"
              :disabled="isLoading || missingRecipientUser || isInvalidCart"
              @click="onPay"
            />
          </UContainer>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
