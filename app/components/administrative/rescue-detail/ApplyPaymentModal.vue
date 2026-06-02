<script setup lang="ts">
import { RESCUE_PAYMENT_METHOD_OPTIONS } from '~/constants/rescue-operative-flow';
import type { RescueAdministrativePaymentFormState } from '~/interfaces/rescue/administrative';

const open = defineModel<boolean>('open', { required: true });

defineProps<{
  loading?: boolean;
}>();

const emit = defineEmits<{
  submit: [];
}>();

const form = defineModel<RescueAdministrativePaymentFormState>('form', {
  required: true,
});

const paymentAmountModel = useStringNumberModel(
  computed({
    get: () => form.value.payment_amount,
    set: (value) => {
      form.value.payment_amount = value;
    },
  }),
);
</script>

<template>
  <UModal
    v-model:open="open"
    title="Aplicar pago"
    :ui="{ content: 'max-w-md' }"
  >
    <template #body>
      <div class="space-y-3">
        <UFormField
          label="Monto"
          name="payment_amount"
          required
        >
          <UInputNumber
            v-model="paymentAmountModel"
            v-bind="catalogCurrencyInputProps"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Fecha"
          name="payment_date"
          required
        >
          <UInput
            v-model="form.payment_date"
            class="w-full"
            type="date"
          />
        </UFormField>

        <UFormField
          label="Forma de pago"
          name="payment_method"
          required
        >
          <USelect
            v-model="form.payment_method"
            class="w-full"
            :items="[...RESCUE_PAYMENT_METHOD_OPTIONS]"
            value-key="value"
            label-key="label"
            placeholder="Selecciona forma de pago"
          />
        </UFormField>

        <UFormField
          label="Referencia"
          name="payment_reference"
        >
          <UInput
            v-model="form.payment_reference"
            class="w-full"
            placeholder="Opcional"
          />
        </UFormField>

        <UButton
          block
          color="primary"
          label="Aplicar pago"
          :loading="loading"
          @click="emit('submit')"
        />
      </div>
    </template>
  </UModal>
</template>
