<script setup lang="ts">
import type { CreditFormState } from '~/interfaces/catalogs/credit';

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

const creditState = defineModel<CreditFormState>('creditState', { required: true });

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
</script>

<template>
  <section class="space-y-4">
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
    <UFormField label="Límite de crédito" required>
      <UInputNumber
        v-model="creditLimitModel"
        v-bind="catalogCurrencyInputProps"
      />
    </UFormField>
    <div class="grid grid-cols-1 gap-2">
      <UFormField label="Días de crédito" required>
        <UInputNumber
          v-model="creditDaysModel"
          v-bind="catalogIntegerInputProps"
        />
      </UFormField>
      <UFormField label="Prórroga (días)" required>
        <UInputNumber
          v-model="creditExtensionModel"
          v-bind="catalogIntegerInputProps"
        />
      </UFormField>
      <UFormField label="Tolerancia remisión (días)" required>
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
  </section>
</template>
