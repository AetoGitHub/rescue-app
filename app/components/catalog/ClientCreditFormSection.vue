<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui';
import type { infer as ZodInfer } from 'zod';
import type { CreditFormState } from '~/interfaces/catalogs/credit';
import { creditFormSchema } from '~/schemas/catalog-create';

const props = withDefaults(
  defineProps<{
    heading?: string;
    intro?: string;
  }>(),
  {
    heading: 'Crédito',
    intro: undefined,
  },
);

const emit = defineEmits<{
  submit: [payload: FormSubmitEvent<ZodInfer<typeof creditFormSchema>>];
  error: [];
}>();

const creditState = defineModel<CreditFormState>('creditState', { required: true });

const formRef = ref<{ submit: () => Promise<void> } | null>(null);

const creditLimitSource = computed({
  get: () => creditState.value.limit,
  set: (value: string) => {
    creditState.value.limit = value;
  },
});
const creditDaysSource = computed({
  get: () => creditState.value.days,
  set: (value: number) => {
    creditState.value.days = value;
  },
});
const creditExtensionSource = computed({
  get: () => creditState.value.extension,
  set: (value: number) => {
    creditState.value.extension = value;
  },
});
const creditRemisionToleranceSource = computed({
  get: () => creditState.value.remision_tolerance,
  set: (value: number) => {
    creditState.value.remision_tolerance = value;
  },
});

const creditLimitModel = useStringNumberModel(creditLimitSource);
const creditDaysModel = useRequiredIntegerModel(creditDaysSource);
const creditExtensionModel = useRequiredIntegerModel(creditExtensionSource);
const creditRemisionToleranceModel = useRequiredIntegerModel(
  creditRemisionToleranceSource,
);

function onSubmit(payload: FormSubmitEvent<ZodInfer<typeof creditFormSchema>>) {
  emit('submit', payload);
}

async function submit() {
  await formRef.value?.submit();
}

defineExpose({ submit });
</script>

<template>
  <UForm
    ref="formRef"
    :schema="creditFormSchema"
    :state="creditState"
    class="space-y-4"
    @submit="onSubmit"
    @error="emit('error')"
  >
    <div v-if="props.intro" class="space-y-1 text-center">
      <p class="font-medium text-default">
        {{ props.heading === 'Crédito' ? 'Sin línea de crédito' : props.heading }}
      </p>
      <p class="text-sm text-muted">
        {{ props.intro }}
      </p>
    </div>
    <h3
      v-else
      class="text-xs font-semibold uppercase tracking-wider text-primary"
    >
      {{ props.heading }}
    </h3>
    <UFormField label="Límite de crédito" name="limit" required>
      <UInputNumber
        v-model="creditLimitModel"
        v-bind="catalogCurrencyInputProps"
      />
    </UFormField>
    <div class="grid grid-cols-1 gap-2">
      <UFormField label="Días de crédito" name="days" required>
        <UInputNumber
          v-model="creditDaysModel"
          v-bind="catalogIntegerInputProps"
        />
      </UFormField>
      <UFormField label="Prórroga (días)" name="extension" required>
        <UInputNumber
          v-model="creditExtensionModel"
          v-bind="catalogIntegerInputProps"
        />
      </UFormField>
      <UFormField label="Tolerancia remisión (días)" name="remision_tolerance" required>
        <UInputNumber
          v-model="creditRemisionToleranceModel"
          v-bind="catalogIntegerInputProps"
        />
      </UFormField>
    </div>
    <UFormField name="requires_purchase_order">
      <UCheckbox
        v-model="creditState.requires_purchase_order"
        label="El cliente requiere orden de compra"
      />
    </UFormField>
    <UFormField name="is_blocked">
      <UCheckbox
        v-model="creditState.is_blocked"
        label="Bloquear crédito del cliente"
      />
    </UFormField>
  </UForm>
</template>
