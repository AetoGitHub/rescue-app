<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui';
import {
  CREDIT_UNLOCK_MODE_OPTIONS,
  creditUnlockFormSchema,
  creditUnlockFormToCreateBody,
  type CreditUnlockFormState,
} from '~/schemas/credit-unlock';

const props = defineProps<{
  creditId: number;
  loading?: boolean;
}>();

const emit = defineEmits<{
  submit: [body: ReturnType<typeof creditUnlockFormToCreateBody>];
}>();

const open = defineModel<boolean>('open', { required: true });

const formRef = ref<{ submit: () => Promise<void> } | null>(null);

function emptyState(): CreditUnlockFormState {
  return {
    mode: 'money',
    value: '',
  };
}

const state = reactive<CreditUnlockFormState>(emptyState());

const valueMoneySource = computed({
  get: () => state.value,
  set: (value: string) => {
    state.value = value;
  },
});
const valueDaysSource = computed({
  get: () => Number(state.value) || 0,
  set: (value: number) => {
    state.value = String(value);
  },
});

const valueMoneyModel = useStringNumberModel(valueMoneySource);
const valueDaysModel = useRequiredIntegerModel(valueDaysSource);

watch(open, (isOpen) => {
  if (!isOpen) Object.assign(state, emptyState());
});

watch(
  () => state.mode,
  () => {
    state.value = '';
  },
);

async function onSubmit(event: FormSubmitEvent<CreditUnlockFormState>) {
  emit('submit', creditUnlockFormToCreateBody(props.creditId, event.data));
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
    title="Crear extensión de crédito"
    :ui="{ content: 'max-w-md' }"
  >
    <template #body>
      <UForm
        ref="formRef"
        :state="state"
        :schema="creditUnlockFormSchema"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Tipo" name="mode" required>
          <USelect
            v-model="state.mode"
            :items="[...CREDIT_UNLOCK_MODE_OPTIONS]"
            value-key="value"
            class="w-full"
          />
        </UFormField>

        <UFormField
          :label="state.mode === 'money' ? 'Monto extra' : 'Días de gracia'"
          name="value"
          required
        >
          <UInputNumber
            v-if="state.mode === 'money'"
            v-model="valueMoneyModel"
            v-bind="catalogCurrencyInputProps"
          />
          <UInputNumber
            v-else
            v-model="valueDaysModel"
            v-bind="catalogIntegerInputProps"
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
          label="Crear"
          :loading="loading"
          @click="requestSubmit"
        />
      </div>
    </template>
  </UModal>
</template>
