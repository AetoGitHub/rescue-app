<script setup lang="ts">
import type { RescueInvoiceFormState } from '~/interfaces/rescue/administrative';

const open = defineModel<boolean>('open', { required: true });

defineProps<{
  loading?: boolean;
}>();

const emit = defineEmits<{
  submit: [];
  regenerate: [];
}>();

const form = defineModel<RescueInvoiceFormState>('form', { required: true });

const invoiceAmountModel = useStringNumberModel(
  computed({
    get: () => form.value.invoice_amount,
    set: (value) => {
      form.value.invoice_amount = value;
    },
  }),
);
</script>

<template>
  <UModal
    v-model:open="open"
    title="Registrar factura"
    :ui="{ content: 'max-w-md' }"
  >
    <template #body>
      <div class="space-y-3">
        <UFormField
          label="Número de factura"
          name="invoice_number"
          required
        >
          <div class="flex gap-2">
            <UInput
              v-model="form.invoice_number"
              class="w-full"
            />
            <UButton
              color="neutral"
              icon="i-lucide-refresh-cw"
              variant="subtle"
              @click="emit('regenerate')"
            />
          </div>
        </UFormField>

        <UFormField
          label="Fecha"
          name="invoice_date"
          required
        >
          <UInput
            v-model="form.invoice_date"
            class="w-full"
            type="date"
          />
        </UFormField>

        <UFormField
          label="Monto"
          name="invoice_amount"
          required
        >
          <UInputNumber
            v-model="invoiceAmountModel"
            v-bind="catalogCurrencyInputProps"
            class="w-full"
          />
        </UFormField>

        <UButton
          block
          color="primary"
          label="Registrar factura"
          :loading="loading"
          @click="emit('submit')"
        />
      </div>
    </template>
  </UModal>
</template>
