<script setup lang="ts">
import {
  formatAdvanceQuickCalcLabel,
  RESCUE_ADVANCE_NO_QUOTE_WARNING,
  RESCUE_ADVANCE_PANEL_COPY,
  RESCUE_ADVANCE_PANEL_TITLES,
  RESCUE_ADVANCE_PERCENT_SHORTCUTS,
  RESCUE_OPERATIVE_TOAST,
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
  cancel: [];
}>();

const form = defineModel<RescueAdvanceFormState>('form', { required: true });

const selectedPercent = ref<number | null>(null);

const advanceAmountSource = computed({
  get: () => form.value.advance_amount,
  set: (value: string) => {
    form.value.advance_amount = value;
    selectedPercent.value = null;
  },
});

const advanceAmountModel = useStringNumberModel(advanceAmountSource);

const isAmountMode = computed(
  () => props.mode === 'request' || props.mode === 'modify',
);

const showPaymentFields = computed(() => props.mode === 'confirm');

const confirmOnly = computed(() => props.mode === 'approve_without');

const showPercentShortcuts = computed(
  () => isAmountMode.value && props.quoteTotal > 0,
);

const showNoQuoteWarning = computed(
  () => isAmountMode.value && props.quoteTotal <= 0,
);

const quickCalcLabel = computed(() =>
  formatAdvanceQuickCalcLabel(formatRescueCardMoney(props.quoteTotal)),
);

const panelTitle = computed(() => {
  if (props.mode === 'request' || props.mode === 'modify') {
    return RESCUE_ADVANCE_PANEL_COPY.configureTitle;
  }
  return RESCUE_ADVANCE_PANEL_TITLES[props.mode];
});

const primaryButtonLabel = computed(() => {
  switch (props.mode) {
    case 'request':
      return RESCUE_ADVANCE_PANEL_COPY.confirmRequest;
    case 'modify':
      return RESCUE_ADVANCE_PANEL_COPY.confirmModify;
    case 'confirm':
      return RESCUE_ADVANCE_PANEL_COPY.confirmReceived;
    case 'approve_without':
      return RESCUE_ADVANCE_PANEL_COPY.confirmApproveWithout;
    default:
      return 'Guardar';
  }
});

const toast = useToast();
const panelRef = ref<HTMLElement | null>(null);
const panelEndRef = ref<HTMLElement | null>(null);
let panelResizeObserver: ResizeObserver | null = null;

function scrollTarget() {
  return panelEndRef.value ?? panelRef.value;
}

function scrollPanelIntoView() {
  nextTick(() => {
    scrollScrollableAncestorToBottomWithRetries(scrollTarget(), {
      bottomOffset: 32,
    });
  });
}

function startPanelScrollObserver() {
  panelResizeObserver?.disconnect();
  if (panelRef.value == null || typeof ResizeObserver === 'undefined') return;

  panelResizeObserver = new ResizeObserver(() => {
    scrollScrollableAncestorToBottom(scrollTarget(), { bottomOffset: 32 });
  });
  panelResizeObserver.observe(panelRef.value);
  window.setTimeout(() => {
    panelResizeObserver?.disconnect();
    panelResizeObserver = null;
  }, 600);
}

watch(
  () => open.value,
  (isOpen) => {
    if (isOpen) {
      scrollPanelIntoView();
      startPanelScrollObserver();
    } else {
      panelResizeObserver?.disconnect();
      panelResizeObserver = null;
    }
  },
);

onMounted(() => {
  if (open.value) {
    scrollPanelIntoView();
    startPanelScrollObserver();
  }
});

onBeforeUnmount(() => {
  panelResizeObserver?.disconnect();
});

function applyPercent(percent: number) {
  if (props.quoteTotal <= 0) return;
  selectedPercent.value = percent;
  const amount = computeAdvanceAmountFromPercent(props.quoteTotal, percent);
  form.value.advance_amount = formatAdvanceAmountForInput(amount);
}

function onCancel() {
  open.value = false;
  emit('cancel');
}

function onSubmit() {
  if (!confirmOnly.value) {
    const amount = parseAdvanceAmountValue(form.value.advance_amount);
    if (amount <= 0) {
      toast.add({
        title: RESCUE_OPERATIVE_TOAST.advanceAmountRequired,
        color: 'error',
      });
      return;
    }
  }
  emit('submit');
}
</script>

<template>
  <section
    ref="panelRef"
    class="scroll-mt-4 space-y-4 rounded-lg border border-default bg-default p-4 pb-6"
  >
    <div class="flex items-center gap-2">
      <UIcon
        v-if="isAmountMode"
        name="i-lucide-clock"
        class="size-4 text-primary"
      />
      <h3 class="text-sm font-semibold text-highlighted">
        {{ panelTitle }}
      </h3>
    </div>

    <p
      v-if="confirmOnly"
      class="text-sm text-muted"
    >
      {{ RESCUE_ADVANCE_PANEL_COPY.approveWithoutMessage }}
    </p>

    <template v-if="!confirmOnly">
      <UFormField
        v-if="isAmountMode"
        :label="RESCUE_ADVANCE_PANEL_COPY.amountLabel"
        name="advance_amount"
        required
      >
        <UInputNumber
          v-model="advanceAmountModel"
          v-bind="catalogCurrencyInputProps"
          class="w-full"
        />
        <p class="mt-1 text-xs text-muted">
          {{ RESCUE_ADVANCE_PANEL_COPY.amountHelper }}
        </p>
      </UFormField>

      <UAlert
        v-if="showNoQuoteWarning"
        color="warning"
        variant="subtle"
        icon="i-lucide-triangle-alert"
        :title="RESCUE_ADVANCE_NO_QUOTE_WARNING"
      />

      <div
        v-if="showPercentShortcuts"
        class="space-y-2"
      >
        <p class="text-sm text-highlighted">
          {{ quickCalcLabel }}
        </p>
        <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <UButton
            v-for="pct in RESCUE_ADVANCE_PERCENT_SHORTCUTS"
            :key="pct"
            :color="selectedPercent === pct ? 'primary' : 'neutral'"
            :variant="selectedPercent === pct ? 'solid' : 'outline'"
            class="h-auto w-full flex-col gap-1 py-3"
            @click="applyPercent(pct)"
          >
            <span class="text-sm font-semibold">{{ pct }}%</span>
            <span
              class="text-xs tabular-nums"
              :class="selectedPercent === pct ? 'text-inverted/80' : 'text-muted'"
            >
              {{ getAdvancePercentPreview(quoteTotal, pct) }}
            </span>
          </UButton>
        </div>
      </div>

      <template v-if="showPaymentFields">
        <UFormField
          :label="RESCUE_ADVANCE_PANEL_COPY.amountLabel"
          name="advance_amount"
          required
        >
          <UInputNumber
            v-model="advanceAmountModel"
            v-bind="catalogCurrencyInputProps"
            class="w-full"
          />
        </UFormField>

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

    <div
      ref="panelEndRef"
      class="flex flex-wrap items-center justify-between gap-3 pt-2"
    >
      <UButton
        color="primary"
        icon="i-lucide-check"
        :label="primaryButtonLabel"
        :loading="loading"
        :disabled="loading"
        class="disabled:opacity-60"
        @click="onSubmit"
      />
      <UButton
        color="neutral"
        label="Cancelar"
        variant="link"
        :disabled="loading"
        @click="onCancel"
      />
    </div>
  </section>
</template>
