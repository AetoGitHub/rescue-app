<script setup lang="ts">
import { h } from 'vue';
import type { TableColumn } from '@nuxt/ui';
import type { PaymentCheckoutDebtRow } from '~/interfaces/payment/checkout-debt';
import type { PaymentCartCheckoutRow } from '~/utils/payment-cart-display';
import { adminListContainerClass } from '~/constants/admin-list-layout';

const checkoutPanelUi = {
  body: 'flex min-h-0 flex-1 flex-col overflow-hidden',
} as const;

useHead({
  title: 'Checkout de pago',
});

const toast = useToast();

const { cart, isLoading, errorMessage, refresh } = usePaymentCart();

onMounted(() => {
  void refresh();
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

const hasCartItems = computed(() => itemCount.value > 0);

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
  return type === 'operative' ? 'Operador' : 'Vendedor';
}

function recipientName(row: PaymentCartCheckoutRow): string {
  if (row.recipientType === 'operative') {
    return formatOptionalCell(row.operator_name);
  }
  return formatOptionalCell(row.seller_name ?? row.operator_name);
}

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
    accessorKey: 'rescue_folio',
    header: 'Folio',
    cell: ({ row }) =>
      h('span', { class: 'font-medium' }, row.original.rescue_folio),
  },
  {
    id: 'recipient_type',
    header: 'Tipo',
    cell: ({ row }) =>
      h('span', recipientTypeLabel(row.original.recipientType)),
  },
  {
    id: 'name',
    header: 'Beneficiario',
    cell: ({ row }) => h('span', recipientName(row.original)),
  },
  {
    id: 'client_name',
    header: 'Compañía',
    cell: ({ row }) => h('span', formatOptionalCell(row.original.client_name)),
  },
  {
    id: 'awn_date',
    header: 'Activo sin cotizar',
    cell: ({ row }) =>
      h(
        'span',
        { class: 'text-muted' },
        row.original.awn_date != null
          ? formatPaymentDate(row.original.awn_date)
          : '—',
      ),
  },
  {
    id: 'debt_created_at',
    header: 'Fecha creación deuda',
    cell: ({ row }) =>
      h(
        'span',
        { class: 'text-muted' },
        row.original.debt_created_at != null
          ? formatPaymentDate(row.original.debt_created_at)
          : formatPaymentDate(row.original.created_at),
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
  },
]);

const debtColumns = computed((): TableColumn<PaymentCheckoutDebtRow>[] => [
  {
    accessorKey: 'concept',
    header: 'Concepto',
    cell: ({ row }) => h('span', row.original.concept),
  },
  {
    id: 'amount',
    header: 'Monto',
    cell: ({ row }) =>
      h(
        'span',
        { class: 'tabular-nums' },
        formatRescueCardMoney(row.original.amount),
      ),
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: () => h('span', { class: 'text-muted' }, '—'),
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

            <div
              v-else-if="hasCartItems"
              class="flex flex-col gap-6"
            >
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

              <section class="space-y-3">
                <h2 class="text-lg font-semibold">Rescates a pagar</h2>
                <div class="overflow-x-auto rounded-lg border border-default">
                  <UTable
                    class="w-full"
                    :columns="rescueColumns"
                    :data="cartRows"
                    :get-row-id="
                      (row: PaymentCartCheckoutRow) =>
                        `${row.recipientType}-${row.id}`
                    "
                  />
                </div>
              </section>

              <section class="space-y-3">
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <h2 class="text-lg font-semibold">Deuda</h2>
                  <UButton
                    label="Agregar deuda"
                    icon="i-lucide-plus"
                    color="primary"
                    variant="outline"
                    @click="onAddDebt"
                  />
                </div>

                <div
                  v-if="debtRows.length === 0"
                  class="flex items-center justify-center rounded-lg border border-dashed border-default py-12 text-center text-sm text-muted"
                >
                  No hay deudas agregadas.
                </div>

                <div
                  v-else
                  class="overflow-x-auto rounded-lg border border-default"
                >
                  <UTable
                    class="w-full"
                    :columns="debtColumns"
                    :data="debtRows"
                    :get-row-id="(row: PaymentCheckoutDebtRow) => row.id"
                  />
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
              :disabled="isLoading"
              @click="onPay"
            />
          </UContainer>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
