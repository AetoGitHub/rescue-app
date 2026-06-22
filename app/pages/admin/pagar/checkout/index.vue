<script setup lang="ts">
import { h, resolveComponent } from 'vue';
import type { TableColumn } from '@nuxt/ui';
import type { PaymentCheckoutDebtRow } from '~/interfaces/payment/checkout-debt';
import type { PaymentCartCheckoutRow } from '~/utils/payment-cart-display';
import { adminListContainerClass } from '~/constants/admin-list-layout';

const checkoutPanelUi = {
  body: 'flex min-h-0 flex-1 flex-col overflow-hidden',
} as const;

const UCheckbox = resolveComponent('UCheckbox');
const UIcon = resolveComponent('UIcon');
const UTooltip = resolveComponent('UTooltip');

useHead({
  title: 'Checkout de pago',
});

const isDev = import.meta.dev;
const toast = useToast();

const {
  testDaysInput,
  appliedTestDays,
  applyTestDaysSimulation,
  clearTestDaysSimulation,
} = usePaymentCartTestDays();

const {
  cart,
  isLoading,
  isPaying,
  errorMessage,
  refresh,
  payCart,
} = usePaymentCart(appliedTestDays);

const { recipient, syncRecipientUserName } = usePaymentCheckoutRecipient();
const { createDebt, isCreating } = usePaymentDebtCreate();

const createDebtModalOpen = ref(false);
const forgivenCartIds = ref<Set<number>>(new Set());
const forgivenDebtIds = ref<Set<number>>(new Set());

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

const checkoutUserId = computed(() => checkoutRecipient.value?.userId ?? null);

const {
  rows: debtRows,
  isInitialLoading: debtLoading,
  errorMessage: debtErrorMessage,
  refresh: refreshDebts,
} = usePaymentDebtList(checkoutUserId, {
  payment: false,
  enabled: computed(() => checkoutUserId.value != null),
});

watch(cartRecipientSummary, (summary) => {
  if (summary != null) {
    syncRecipientUserName(summary.userName);
  }
});

watch(appliedTestDays, () => {
  void refresh();
});

const cartRows = computed((): PaymentCartCheckoutRow[] =>
  cart.value != null ? flattenPaymentCartItems(cart.value) : [],
);

const checkoutTotalsInput = computed(() => ({
  cartItems: cartRows.value,
  debts: debtRows.value,
  forgivenCartIds: forgivenCartIds.value,
  forgivenDebtIds: forgivenDebtIds.value,
}));

const rescueSubtotal = computed(() =>
  computeCheckoutCartSubtotal(checkoutTotalsInput.value),
);

const debtSubtotal = computed(() =>
  computeCheckoutDebtSubtotal(checkoutTotalsInput.value),
);

const grandTotal = computed(() =>
  computeCheckoutGrandTotal(checkoutTotalsInput.value),
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

function toggleForgivenCart(id: number, checked: boolean) {
  const next = new Set(forgivenCartIds.value);
  if (checked) next.add(id);
  else next.delete(id);
  forgivenCartIds.value = next;
}

function toggleForgivenDebt(id: number, checked: boolean) {
  const next = new Set(forgivenDebtIds.value);
  if (checked) next.add(id);
  else next.delete(id);
  forgivenDebtIds.value = next;
}

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

function onAddDebt() {
  if (checkoutUserId.value == null) {
    toast.add({
      title: 'Usuario no identificado',
      description: 'Regresa a Pagar y selecciona el beneficiario del pago.',
      color: 'warning',
    });
    return;
  }

  createDebtModalOpen.value = true;
}

async function onCreateDebtSubmit(
  body: Parameters<typeof createDebt>[0],
) {
  await createDebt(body);
  createDebtModalOpen.value = false;
  await Promise.all([refresh(), refreshDebts()]);
}

function onCancel() {
  void navigateTo('/admin/pagar');
}

async function onPay() {
  if (missingRecipientUser.value || isInvalidCart.value) return;

  try {
    await payCart({
      forgiven: [...forgivenCartIds.value],
      forgiven_debt: [...forgivenDebtIds.value],
    });
    void navigateTo('/admin/pagar');
  } catch {
    // El toast de error lo muestra usePaymentCart.
  }
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
    id: 'forgive',
    header: 'Perdonar',
    cell: ({ row }) => {
      if (!row.original.is_penalty) {
        return h('span', { class: 'text-muted' }, '—');
      }

      return h(UCheckbox, {
        modelValue: forgivenCartIds.value.has(row.original.id),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
          toggleForgivenCart(row.original.id, value === true),
        ariaLabel: `Perdonar penalización ${row.original.rescue_folio}`,
      });
    },
    meta: {
      class: {
        th: 'w-24 text-center',
        td: 'w-24 text-center',
      },
    },
  },
  {
    id: 'amount',
    header: 'Cantidad',
    cell: ({ row }) =>
      h(
        'span',
        { class: 'tabular-nums' },
        formatRescueCardMoney(
          computeCheckoutCartLineAmount(
            row.original,
            forgivenCartIds.value.has(row.original.id),
          ),
        ),
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
    cell: ({ row }) =>
      h(UCheckbox, {
        modelValue: forgivenDebtIds.value.has(row.original.id),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
          toggleForgivenDebt(row.original.id, value === true),
        ariaLabel: `Perdonar deuda ${row.original.rescue_folio}`,
      }),
    meta: {
      class: {
        th: 'w-28 text-center',
        td: 'w-28 text-center',
      },
    },
  },
  {
    accessorKey: 'rescue_folio',
    header: 'Folio',
    cell: ({ row }) => h('span', row.original.rescue_folio),
  },
  {
    id: 'date',
    header: 'Fecha',
    cell: ({ row }) =>
      h('span', { class: 'text-muted' }, formatPaymentDate(row.original.created_at)),
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

            <UPageCard
              v-if="isDev && hasCartItems"
              variant="subtle"
              :ui="{ body: 'flex flex-wrap items-end gap-3' }"
              class="mt-4"
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
                :loading="isLoading"
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

            <UAlert
              v-if="isDev && appliedTestDays != null && hasCartItems"
              class="mt-4"
              color="warning"
              variant="subtle"
              icon="i-lucide-flask-conical"
              title="Modo prueba (dev)"
              :description="`Simulando ${appliedTestDays} día${appliedTestDays === 1 ? '' : 's'} de penalización en el carrito.`"
            />

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

              <UPageCard class="flex flex-col gap-3">
                <div class="flex flex-wrap items-end justify-between gap-4">
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
                </div>
                <div class="grid gap-1 text-sm text-muted sm:grid-cols-3">
                  <p>
                    Comisiones:
                    <span class="tabular-nums text-default">
                      {{ formatRescueCardMoney(rescueSubtotal) }}
                    </span>
                  </p>
                  <p>
                    Deudas:
                    <span class="tabular-nums text-default">
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
                    class="grid grid-cols-5 border-t border-default px-4 py-3 text-sm"
                  >
                    <div class="col-span-3 text-center font-semibold">
                      Subtotal
                    </div>
                    <div class="col-span-2 text-right tabular-nums font-semibold">
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
                    :disabled="checkoutUserId == null"
                    @click="onAddDebt"
                  />
                </div>

                <UAlert
                  v-if="debtErrorMessage"
                  color="error"
                  variant="subtle"
                  icon="i-lucide-circle-alert"
                  title="No se pudieron cargar las deudas"
                  :description="debtErrorMessage"
                />

                <div class="overflow-hidden rounded-lg border border-default">
                  <UTable
                    class="w-full"
                    :columns="debtColumns"
                    :data="debtRows"
                    :loading="debtLoading"
                    :get-row-id="(row: PaymentCheckoutDebtRow) => String(row.id)"
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
                      −{{ formatRescueCardMoney(debtSubtotal) }}
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
              :loading="isPaying"
              :disabled="isPaying || missingRecipientUser || isInvalidCart"
              @click="onPay"
            />
          </UContainer>
        </div>
      </div>

      <PaymentCreateDebtModal
        v-if="checkoutUserId != null"
        v-model:open="createDebtModalOpen"
        :user-id="checkoutUserId"
        :loading="isCreating"
        @submit="onCreateDebtSubmit"
      />
    </template>
  </UDashboardPanel>
</template>
