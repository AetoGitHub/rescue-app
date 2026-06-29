<script setup lang="ts">
import type {
  AdministrativeRescueDetail,
  RescueAdministrativeActionId,
  RescueAdministrativeFlowContext,
} from '~/interfaces/rescue/administrative';
import {
  getAdministrativeFooterActions,
  getAdministrativeRemissionAlert,
  getAdministrativeStepperCurrentIndex,
  getAdministrativeStepperItems,
  getAdministrativeStepperSteps,
  isAdministrativeLinearStepperVisible,
  showOperativeWarningBanner,
} from '~/utils/rescue-administrative-flow';

const props = defineProps<{
  detail: AdministrativeRescueDetail;
  flowContext: RescueAdministrativeFlowContext;
  purchaseOrderHighlight?: boolean;
  purchaseOrderNumber: string;
  loading?: boolean;
}>();

const emit = defineEmits<{
  action: [id: RescueAdministrativeActionId];
  'update:purchaseOrderNumber': [value: string];
  savePurchaseOrder: [];
  document: [channel: 'pdf' | 'email' | 'whatsapp'];
}>();

const purchaseOrderModel = computed({
  get: () => props.purchaseOrderNumber,
  set: (value: string) => emit('update:purchaseOrderNumber', value),
});

const billingBadge = computed(() =>
  getBillingStatusBadge(props.flowContext.billing_status),
);

const remissionAlert = computed(() =>
  getAdministrativeRemissionAlert(props.flowContext),
);

const stepperSteps = computed(() =>
  getAdministrativeStepperSteps(props.flowContext),
);

const currentStepIndex = computed(() =>
  getAdministrativeStepperCurrentIndex(
    stepperSteps.value,
    props.flowContext.billing_status,
  ),
);

const stepperItems = computed(() =>
  getAdministrativeStepperItems(stepperSteps.value),
);

const showStepper = computed(() =>
  isAdministrativeLinearStepperVisible(props.flowContext.billing_status),
);

const actions = computed(() => getAdministrativeFooterActions(props.flowContext));

const primaryActions = computed(() =>
  actions.value.filter((action) => action.primary),
);

const secondaryActions = computed(() =>
  actions.value.filter((action) => !action.primary),
);

const showWarning = computed(() =>
  showOperativeWarningBanner(props.flowContext),
);

function onAction(id: RescueAdministrativeActionId) {
  emit('action', id);
}
</script>

<template>
  <section class="space-y-4 rounded-lg border border-default bg-elevated/50 p-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 class="text-xs font-semibold uppercase tracking-wide text-primary">
        Gestión administrativa
      </h2>
      <UBadge
        :color="billingBadge.color"
        :label="billingBadge.label"
        variant="subtle"
        class="uppercase"
      />
    </div>

    <UAlert
      v-if="remissionAlert"
      color="info"
      icon="i-lucide-file-x"
      :title="remissionAlert.title"
      :description="remissionAlert.description"
      :ui="{ root: 'border border-info/30' }"
    />

    <UStepper
      v-if="showStepper && stepperItems.length > 0"
      :model-value="currentStepIndex"
      :items="stepperItems"
      disabled
      size="sm"
      class="w-full overflow-x-auto"
      :ui="{
        title: 'uppercase tracking-wide text-xs hidden sm:block',
        wrapper: 'min-w-max sm:min-w-0',
      }"
    />

    <AdministrativeRescueDetailPaidSummaryPanel
      v-if="detail.billing_status === 'paid'"
      :detail="detail"
    />

    <div
      v-if="actions.length"
      class="flex flex-wrap gap-2 pt-1"
    >
      <UButton
        v-for="action in primaryActions"
        :key="action.id"
        :color="
          action.id === 'open_warranty' && detail.billing_status === 'paid'
            ? 'neutral'
            : (action.color ?? 'primary')
        "
        :disabled="action.disabled || loading"
        :label="action.label"
        :loading="loading && action.primary"
        :variant="
          action.id === 'open_warranty' && detail.billing_status === 'paid'
            ? 'outline'
            : 'solid'
        "
        @click="onAction(action.id)"
      />
      <UButton
        v-for="action in secondaryActions"
        :key="action.id"
        :color="action.color ?? 'neutral'"
        :disabled="action.disabled || loading"
        :label="action.label"
        :variant="action.color === 'error' ? 'outline' : 'subtle'"
        @click="onAction(action.id)"
      />
    </div>

    <UAlert
      v-if="showWarning"
      color="warning"
      icon="i-lucide-alert-triangle"
      title="El servicio operativo no está cerrado conforme"
      description="Revisa el estatus operativo antes de continuar con facturación."
    />

    <UAlert
      v-if="detail.billing_status === 'warranty'"
      color="warning"
      icon="i-lucide-shield-alert"
      title="Garantía abierta"
      description="Resuelve la garantía desde el módulo correspondiente para retomar el flujo."
    />

    <UAlert
      v-if="detail.billing_status === 'canceled'"
      color="error"
      icon="i-lucide-ban"
      title="Cancelado administrativamente"
      :description="detail.admin_cancellation_reason ?? 'Sin motivo registrado'"
    />

    <AdministrativeRescueDetailPurchaseOrderSection
      v-if="detail.requires_purchase_order"
      v-model:purchase-order-number="purchaseOrderModel"
      :highlight="purchaseOrderHighlight"
      :loading="loading"
      @save="emit('savePurchaseOrder')"
    />

    <UCard
      v-if="detail.billing_status === 'in_remittance' && detail.remittance_number"
      :ui="{ body: 'space-y-3 p-4' }"
    >
      <p class="text-sm font-medium">
        Remisión: {{ detail.remittance_number }}
      </p>
      <div class="flex flex-wrap gap-2">
        <UButton
          color="neutral"
          icon="i-lucide-file-text"
          label="PDF"
          size="sm"
          variant="subtle"
          @click="emit('document', 'pdf')"
        />
        <UButton
          color="neutral"
          icon="i-lucide-mail"
          label="Email"
          size="sm"
          variant="subtle"
          @click="emit('document', 'email')"
        />
        <UButton
          color="neutral"
          icon="i-lucide-message-circle"
          label="WhatsApp"
          size="sm"
          variant="subtle"
          @click="emit('document', 'whatsapp')"
        />
      </div>
    </UCard>

    <UCard
      v-if="detail.billing_status === 'invoiced' && detail.invoice_number"
      :ui="{ body: 'space-y-3 p-4' }"
    >
      <p class="text-sm font-medium">
        Factura: {{ detail.invoice_number }}
      </p>
      <p class="text-xs text-muted">
        {{ detail.invoice_date }} — {{ formatRescueCardMoney(detail.invoice_amount) }}
      </p>
      <div class="flex flex-wrap gap-2">
        <UButton
          color="neutral"
          icon="i-lucide-file-text"
          label="PDF"
          size="sm"
          variant="subtle"
          @click="emit('document', 'pdf')"
        />
        <UButton
          color="neutral"
          icon="i-lucide-mail"
          label="Email"
          size="sm"
          variant="subtle"
          @click="emit('document', 'email')"
        />
        <UButton
          color="neutral"
          icon="i-lucide-message-circle"
          label="WhatsApp"
          size="sm"
          variant="subtle"
          @click="emit('document', 'whatsapp')"
        />
      </div>
    </UCard>
  </section>
</template>
