<script setup lang="ts">
import type { PaymentCartResponse } from '~/interfaces/payment/cart';

defineProps<{
  cart: PaymentCartResponse | null | undefined;
  loading?: boolean;
  clearing?: boolean;
  checkoutDisabled?: boolean;
}>();

const emit = defineEmits<{
  clear: [];
  checkout: [];
}>();
</script>

<template>
  <UCard class="flex flex-col">
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <h2 class="text-lg font-semibold">
          Carrito de pago
        </h2>
        <UBadge
          v-if="cart"
          color="primary"
          variant="subtle"
        >
          {{ cart.operative.count + cart.seller.count }} items
        </UBadge>
      </div>
    </template>

    <div v-if="loading" class="space-y-3 py-2">
      <USkeleton class="h-4 w-full" />
      <USkeleton class="h-4 w-3/4" />
      <USkeleton class="h-4 w-1/2" />
    </div>

    <div v-else-if="cart" class="space-y-4">
      <div class="space-y-1">
        <p class="text-sm font-medium text-muted">
          Operadores
        </p>
        <p class="text-sm">
          {{ cart.operative.count }} deuda{{ cart.operative.count === 1 ? '' : 's' }}
          ·
          <span class="tabular-nums font-medium">
            {{ formatRescueCardMoney(cart.operative.total_amount) }}
          </span>
        </p>
      </div>

      <div class="space-y-1">
        <p class="text-sm font-medium text-muted">
          Vendedores
        </p>
        <p class="text-sm">
          {{ cart.seller.count }} deuda{{ cart.seller.count === 1 ? '' : 's' }}
          ·
          <span class="tabular-nums font-medium">
            {{ formatRescueCardMoney(cart.seller.total_amount) }}
          </span>
        </p>
      </div>

      <USeparator />

      <div class="flex items-center justify-between gap-2 text-sm">
        <span class="font-medium">Total</span>
        <span class="tabular-nums text-base font-semibold">
          {{
            formatRescueCardMoney(
              String(
                parseRescueCardMoney(cart.operative.total_amount)
                  + parseRescueCardMoney(cart.seller.total_amount),
              ),
            )
          }}
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
          :disabled="loading || clearing || !cart || (cart.operative.count + cart.seller.count === 0)"
          @click="emit('clear')"
        />
        <UButton
          label="Proceder con el pago"
          color="primary"
          icon="i-lucide-credit-card"
          block
          :disabled="checkoutDisabled || loading || !cart || (cart.operative.count + cart.seller.count === 0)"
          @click="emit('checkout')"
        />
      </div>
    </template>
  </UCard>
</template>
