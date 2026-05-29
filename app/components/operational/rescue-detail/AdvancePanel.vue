<script setup lang="ts">
import {
  RESCUE_ADVANCE_PANEL_TITLES,
  RESCUE_ADVANCE_PERCENT_SHORTCUTS,
  RESCUE_PAYMENT_METHOD_OPTIONS,
} from '~/constants/rescue-operative-flow';
import type { RescueAdvanceFormState, RescueAdvancePanelMode } from '~/interfaces/rescue/operative';

const open = defineModel<boolean>('open', { required: true });

const props = defineProps<{
  mode: RescueAdvancePanelMode;
  quoteTotal: number;
  loading?: boolean;
}>();

const emit = defineEmits<{
  submit: [];
}>();

const form = defineModel<RescueAdvanceFormState>('form', { required: true });

const advanceAmountSource = computed({
  get: () => form.value.advance_amount,
  set: (value: string) => {
    form.value.advance_amount = value;
  },
});

const advanceAmountModel = useStringNumberModel(advanceAmountSource);

const title = computed(() => RESCUE_ADVANCE_PANEL_TITLES[props.mode]);

const showPaymentFields = computed(
  () => props.mode === 'confirm',
);

const showPercentShortcuts = computed(
  () =>
    (props.mode === 'request' || props.mode === 'modify')
    && props.quoteTotal > 0,
);

const confirmOnly = computed(() => props.mode === 'approve_without');

function applyPercent(percent: number) {
  if (props.quoteTotal <= 0) return;
  const amount = (props.quoteTotal * percent) / 100;
  form.value.advance_amount = amount.toFixed(2);
}

function onSubmit() {
  emit('submit');
}
</script>

<template>
  <USlideover
    v-model:open="open"
    :title="title"
    :ui="{ content: 'max-w-md' }"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <p
          v-if="mode === 'approve_without'"
          class="text-sm text-muted"
        >
          ¿Confirmas aprobar esta solicitud sin solicitar anticipo al cliente?
        </p>

        <template v-if="!confirmOnly">
          <UFormField
            label="Monto de anticipo"
            name="advance_amount"
            required
          >
            <UInputNumber
              v-model="advanceAmountModel"
              v-bind="catalogCurrencyInputProps"
              class="w-full"
            />
          </UFormField>

          <div
            v-if="showPercentShortcuts"
            class="flex flex-wrap gap-2"
          >
            <UButton
              v-for="pct in RESCUE_ADVANCE_PERCENT_SHORTCUTS"
              :key="pct"
              color="neutral"
              size="xs"
              variant="subtle"
              :label="`${pct}%`"
              @click="applyPercent(pct)"
            />
          </div>
          <p
            v-else-if="mode === 'request' || mode === 'modify'"
            class="text-xs text-muted"
          >
            Los atajos de porcentaje requieren una cotización con total.
          </p>

          <template v-if="showPaymentFields">
            <UFormField
              label="Fecha de recepción"
              name="advance_date"
              required
            >
              <UInput
                v-model="form.advance_date"
                type="date"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="Forma de pago"
              name="advance_payment_method"
              required
            >
              <USelect
                v-model="form.advance_payment_method"
                :items="[...RESCUE_PAYMENT_METHOD_OPTIONS]"
                value-key="value"
                label-key="label"
                placeholder="Seleccionar"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="Referencia / comprobante"
              name="advance_reference"
              required
            >
              <UInput
                v-model="form.advance_reference"
                class="w-full"
                placeholder="Folio o referencia"
              />
            </UFormField>
          </template>
        </template>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          color="neutral"
          label="Cancelar"
          variant="subtle"
          @click="open = false"
        />
        <UButton
          color="primary"
          :label="mode === 'approve_without' ? 'Confirmar' : 'Guardar'"
          :loading="loading"
          @click="onSubmit"
        />
      </div>
    </template>
  </USlideover>
</template>
