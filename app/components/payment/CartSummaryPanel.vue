<script setup lang="ts">
import type { PaymentCartResponse } from '~/interfaces/payment/cart';

const props = defineProps<{
  cart: PaymentCartResponse | null | undefined;
  loading?: boolean;
  clearing?: boolean;
  checkoutDisabled?: boolean;
}>();

const emit = defineEmits<{
  clear: [];
  checkout: [];
}>();

const activeCart = computed(() =>
  props.cart != null ? resolveActivePaymentCart(props.cart) : null,
);

const isInvalidCart = computed(() =>
  activeCart.value != null && isInvalidPaymentCart(activeCart.value),
);

const sectionLabel = computed(() => {
  if (activeCart.value == null || isInvalidPaymentCart(activeCart.value)) {
    return null;
  }

  return paymentCheckoutRecipientSectionLabel(activeCart.value.type);
});

const itemCount = computed(() =>
  props.cart != null ? paymentCartItemCount(props.cart) : 0,
);

const grandTotal = computed(() =>
  props.cart != null ? paymentCartGrandTotal(props.cart) : 0,
);

const hasItems = computed(() => itemCount.value > 0 && !isInvalidCart.value);
</script>

<template>
  <UCard class="flex flex-col">
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <h2 class="text-lg font-semibold">
          Carrito de pago
        </h2>
        <UBadge
          v-if="hasItems"
          color="primary"
          variant="subtle"
        >
          {{ itemCount }} items
        </UBadge>
      </div>
    </template>

    <div v-if="loading" class="space-y-3 py-2">
      <USkeleton class="h-4 w-full" />
      <USkeleton class="h-4 w-3/4" />
      <USkeleton class="h-4 w-1/2" />
    </div>

    <div v-else-if="cart" class="space-y-4">
      <UAlert
        v-if="isInvalidCart"
        color="error"
        variant="subtle"
        icon="i-lucide-circle-alert"
        title="Respuesta inválida del carrito"
        description="El carrito devolvió operadores y vendedores a la vez. Vacía el carrito e inténtalo de nuevo."
      />

      <div
        v-else-if="hasItems && sectionLabel"
        class="space-y-1"
      >
        <p class="text-sm font-medium text-muted">
          {{ sectionLabel }}
        </p>
        <p class="text-sm">
          {{ itemCount }} deuda{{ itemCount === 1 ? '' : 's' }}
          ·
          <span class="tabular-nums font-medium">
            {{ formatRescueCardMoney(grandTotal) }}
          </span>
        </p>
      </div>

      <USeparator v-if="hasItems" />

      <div
        v-if="hasItems"
        class="flex items-center justify-between gap-2 text-sm"
      >
        <span class="font-medium">Total</span>
        <span class="tabular-nums text-base font-semibold">
          {{ formatRescueCardMoney(grandTotal) }}
        </span>
      </div>
    </div>

    <template #footer>
      <div class="flex flex-col gap-2">
        <UButton
          label="Vaciar carrito"
          color="neutral"
          variant="outline"
          icon="i-lucide-trash-2"
          block
          :loading="clearing"
          :disabled="loading || clearing || !cart || !hasItems"
          @click="emit('clear')"
        />
        <UButton
          label="Proceder con el pago"
          color="primary"
          icon="i-lucide-credit-card"
          block
          :disabled="checkoutDisabled || loading || !hasItems"
          @click="emit('checkout')"
        />
      </div>
    </template>
  </UCard>
</template>
