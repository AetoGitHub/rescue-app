<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui';
import {
  paymentDebtCreateSchema,
  paymentDebtCreateToBody,
  type PaymentDebtCreateFormState,
} from '~/schemas/payment-debt-create';
import {
  catalogCurrencyInputProps,
  useStringNumberModel,
} from '~/utils/catalog-form';

const props = defineProps<{
  userId: number;
  loading?: boolean;
}>();

const emit = defineEmits<{
  submit: [body: ReturnType<typeof paymentDebtCreateToBody>];
}>();

const open = defineModel<boolean>('open', { required: true });

const formRef = ref<{ submit: () => Promise<void> } | null>(null);

function emptyState(): PaymentDebtCreateFormState {
  return {
    amount: 0,
    comment: '',
  };
}

const state = reactive<PaymentDebtCreateFormState>(emptyState());

const amountSource = computed({
  get: () => String(state.amount || ''),
  set: (value: string) => {
    state.amount = Number(value) || 0;
  },
});

const amountModel = useStringNumberModel(amountSource);

watch(open, (isOpen) => {
  if (!isOpen) Object.assign(state, emptyState());
});

async function onSubmit(event: FormSubmitEvent<PaymentDebtCreateFormState>) {
  emit('submit', paymentDebtCreateToBody(props.userId, event.data));
}

async function requestSubmit() {
  await formRef.value?.submit();
}

defineExpose({ requestSubmit });
</script>

<template>
  <UModal
    v-model:open="open"
    :dismissible="false"
    title="Agregar deuda"
    :ui="{ content: 'max-w-md' }"
  >
    <template #body>
      <UForm
        ref="formRef"
        :state="state"
        :schema="paymentDebtCreateSchema"
        class="space-y-4"
        @submit="onSubmit"
      >
        <p class="text-sm text-muted">
          Deuda en el momento para el beneficiario del pago.
        </p>

        <UFormField label="Monto" name="amount" required>
          <UInputNumber
            v-model="amountModel"
            v-bind="catalogCurrencyInputProps"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Comentario" name="comment">
          <UTextarea
            v-model="state.comment"
            class="w-full"
            :rows="3"
            placeholder="Opcional"
          />
        </UFormField>
      </UForm>
    </template>

    <template #footer="{ close }">
      <div class="flex w-full justify-end gap-2">
        <UButton
          type="button"
          color="neutral"
          label="Cancelar"
          variant="subtle"
          @click="close()"
        />
        <UButton
          type="button"
          color="primary"
          label="Agregar deuda"
          :loading="loading"
          @click="requestSubmit"
        />
      </div>
    </template>
  </UModal>
</template>
