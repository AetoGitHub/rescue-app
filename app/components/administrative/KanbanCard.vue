<script setup lang="ts">
import type { AdministrativeBillingStatus } from '~/constants/administrative-kanban';
import type { AdministrativeRescueCard } from '~/interfaces/rescue/administrative';
import { parseRescueAdminDocInput } from '~/schemas/rescue-admin-doc';

const props = defineProps<{
  card: AdministrativeRescueCard;
  columnStatus: AdministrativeBillingStatus;
}>();

const emit = defineEmits<{
  select: [card: AdministrativeRescueCard];
  adminDocSend: [
    payload: {
      card: AdministrativeRescueCard;
      remittance_folio: string;
      invoice_folio: string;
    },
  ];
}>();

const toast = useToast();

const serviceTypeBadge = computed(() =>
  getRescueServiceTypeBadge(props.card.service_type),
);

const salePrice = computed(() => formatRescueCardMoney(props.card.sale_price));

const utilLabel = computed(() => {
  const formatted = formatRescueCardMoney(props.card.net_profit);
  return formatted === '—' ? 'Util: —' : `Util: ${formatted}`;
});

const hasUtil = computed(
  () =>
    props.card.net_profit != null
    && props.card.net_profit !== ''
    && formatRescueCardMoney(props.card.net_profit) !== '—',
);

const supplierLabel = computed(() =>
  props.card.supplier_name?.trim() ? props.card.supplier_name : 'Sin proveedor',
);

const supplierBadgeColor = computed(() =>
  props.card.supplier_name?.trim() ? 'neutral' : 'error',
);

const vehicleLabel = computed(() =>
  getRescueCardVehicleLabel(props.card.vehicle),
);

/** La columna del kanban es la fuente de verdad del estatus administrativo. */
const docCard = computed((): AdministrativeRescueCard => ({
  ...props.card,
  billing_status: props.columnStatus,
}));

const showDocSection = computed(() =>
  isKanbanAdminDocSectionVisible(docCard.value),
);

const canEditRemittance = computed(() =>
  isKanbanRemittanceFolioEditable(docCard.value),
);

const canEditInvoice = computed(() =>
  isKanbanInvoiceFolioEditable(docCard.value),
);

const showDocInputs = computed(() =>
  isKanbanAdminDocInputVisible(docCard.value),
);

const savedRemittanceFolio = computed(() =>
  shouldShowKanbanRemittanceReadOnly(docCard.value)
    ? getKanbanRemittanceFolio(docCard.value)
    : null,
);

const savedInvoiceFolio = computed(() =>
  shouldShowKanbanInvoiceReadOnly(docCard.value)
    ? getKanbanInvoiceFolio(docCard.value)
    : null,
);

const remittanceFolio = ref('');
const invoiceFolio = ref('');

const canSendDocs = computed(
  () =>
    (canEditRemittance.value && remittanceFolio.value.trim().length > 0)
    || (canEditInvoice.value && invoiceFolio.value.trim().length > 0),
);

function syncDocFieldsFromCard() {
  remittanceFolio.value = canEditRemittance.value
    ? props.card.remittance_folio?.trim() ?? ''
    : '';
  invoiceFolio.value = canEditInvoice.value
    ? props.card.invoice_folio?.trim() ?? ''
    : '';
}

watch(() => props.card, syncDocFieldsFromCard, { immediate: true, deep: true });

function onCardClick() {
  emit('select', props.card);
}

function onSendDocs() {
  const parsed = parseRescueAdminDocInput({
    remittance_folio: canEditRemittance.value
      ? remittanceFolio.value
      : savedRemittanceFolio.value ?? '',
    invoice_folio: canEditInvoice.value
      ? invoiceFolio.value
      : savedInvoiceFolio.value ?? '',
  });
  if (!parsed.success) {
    toast.add({
      title: parsed.error.issues[0]?.message ?? 'Indica remisión o factura',
      color: 'error',
    });
    return;
  }

  emit('adminDocSend', {
    card: props.card,
    remittance_folio: canEditRemittance.value
      ? remittanceFolio.value.trim()
      : savedRemittanceFolio.value ?? '',
    invoice_folio: canEditInvoice.value
      ? invoiceFolio.value.trim()
      : savedInvoiceFolio.value ?? '',
  });
}
</script>

<template>
  <UCard
    class="cursor-pointer transition-shadow hover:shadow-md"
    :ui="{
      root: 'overflow-hidden shadow-sm ring ring-default',
      body: 'space-y-3 p-3',
    }"
    @click="onCardClick"
  >
    <div class="flex items-start justify-between gap-2">
      <span class="text-sm font-semibold text-primary">
        {{ card.folio }}
      </span>
      <div class="flex shrink-0 flex-wrap items-center justify-end gap-1">
        <UBadge
          v-if="card.blocked"
          color="warning"
          icon="i-lucide-lock"
          label="Bloqueado"
          size="sm"
          variant="subtle"
        />
        <UBadge
          :color="serviceTypeBadge.color as 'info'"
          variant="subtle"
          size="sm"
          class="uppercase tracking-wide"
        >
          <UIcon
            :name="serviceTypeBadge.icon"
            class="size-3.5"
          />
          {{ serviceTypeBadge.label }}
        </UBadge>
      </div>
    </div>

    <div class="space-y-0.5">
      <p class="text-sm font-semibold text-highlighted leading-snug">
        {{ card.client_name }}
      </p>
      <p
        v-if="vehicleLabel"
        class="text-xs text-muted"
      >
        Núm. económico:
        <span class="font-medium text-highlighted">{{ vehicleLabel }}</span>
      </p>
    </div>

    <div
      v-if="showDocSection"
      class="space-y-2"
      @click.stop
    >
      <p
        v-if="savedRemittanceFolio"
        class="text-xs text-muted"
      >
        <span class="font-medium text-highlighted">Remisión:</span>
        {{ savedRemittanceFolio }}
      </p>
      <p
        v-if="savedInvoiceFolio"
        class="text-xs text-muted"
      >
        <span class="font-medium text-highlighted">Factura:</span>
        {{ savedInvoiceFolio }}
      </p>

      <div
        v-if="showDocInputs"
        class="flex items-center gap-1.5"
      >
        <UInput
          v-if="canEditRemittance"
          v-model="remittanceFolio"
          class="min-w-0 flex-1"
          placeholder="Remisión (OC)"
          size="sm"
          variant="subtle"
        />
        <UInput
          v-if="canEditInvoice"
          v-model="invoiceFolio"
          class="min-w-0 flex-1"
          placeholder="Factura"
          size="sm"
          variant="subtle"
        />
        <UButton
          color="primary"
          icon="i-lucide-send"
          size="xs"
          variant="soft"
          title="Enviar documentos"
          :disabled="!canSendDocs"
          @click="onSendDocs"
        />
      </div>
    </div>

    <USeparator />

    <div class="flex items-center justify-between gap-2">
      <UBadge
        :color="supplierBadgeColor as 'neutral'"
        icon="i-lucide-truck"
        :label="supplierLabel"
        variant="subtle"
        size="sm"
        class="min-w-0 max-w-[55%] truncate"
      />
      <div class="text-right shrink-0">
        <p class="text-sm font-semibold text-highlighted tabular-nums">
          {{ salePrice }}
        </p>
        <p
          class="text-xs tabular-nums font-mono"
          :class="hasUtil ? 'text-success font-medium' : 'text-muted'"
        >
          {{ utilLabel }}
        </p>
      </div>
    </div>
  </UCard>
</template>
