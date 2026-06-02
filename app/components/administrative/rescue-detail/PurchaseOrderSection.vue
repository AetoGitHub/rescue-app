<script setup lang="ts">
import { RESCUE_ADMINISTRATIVE_BUTTON_LABELS } from '~/constants/rescue-administrative-flow';

const purchaseOrderNumber = defineModel<string>('purchaseOrderNumber', {
  required: true,
});

defineProps<{
  highlight?: boolean;
  loading?: boolean;
}>();

const emit = defineEmits<{
  save: [];
}>();
</script>

<template>
  <UCard
    :class="highlight ? 'ring-2 ring-error' : ''"
    :ui="{ body: 'space-y-3 p-4' }"
  >
    <div class="flex items-center justify-between gap-2">
      <h3 class="text-sm font-semibold text-highlighted">
        Orden de compra (cliente)
      </h3>
      <UBadge
        v-if="highlight"
        color="error"
        label="Requerida para facturar"
        size="sm"
      />
    </div>

    <UFormField
      label="Número de OC"
      name="purchase_order_number"
      required
    >
      <UInput
        v-model="purchaseOrderNumber"
        class="w-full"
        placeholder="OC del cliente"
      />
    </UFormField>

    <UButton
      color="primary"
      :label="RESCUE_ADMINISTRATIVE_BUTTON_LABELS.savePurchaseOrder"
      :loading="loading"
      @click="emit('save')"
    />
  </UCard>
</template>
