<script setup lang="ts">
import type { AdministrativeRescueCard } from '~/interfaces/rescue/administrative';
import { parseRescueAdminDocInput } from '~/schemas/rescue-admin-doc';

const props = defineProps<{
  card: AdministrativeRescueCard;
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

const showDocInputs = computed(
  () => props.card.billing_status === 'unattended',
);

const remittanceFolio = ref('');
const invoiceFolio = ref('');

const canSendDocs = computed(
  () =>
    remittanceFolio.value.trim().length > 0
    || invoiceFolio.value.trim().length > 0,
);

function syncDocFieldsFromCard() {
  remittanceFolio.value = props.card.remittance_folio?.trim() ?? '';
  invoiceFolio.value = props.card.invoice_folio?.trim() ?? '';
}

watch(() => props.card, syncDocFieldsFromCard, { immediate: true, deep: true });

function onCardClick() {
  emit('select', props.card);
}

function onSendDocs() {
  const parsed = parseRescueAdminDocInput({
    remittance_folio: remittanceFolio.value,
    invoice_folio: invoiceFolio.value,
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
    remittance_folio: remittanceFolio.value.trim(),
    invoice_folio: invoiceFolio.value.trim(),
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
      <UBadge
        :color="serviceTypeBadge.color as 'info'"
        variant="subtle"
        size="sm"
        class="shrink-0 uppercase tracking-wide"
      >
        <UIcon
          :name="serviceTypeBadge.icon"
          class="size-3.5"
        />
        {{ serviceTypeBadge.label }}
      </UBadge>
    </div>

    <p class="text-sm font-semibold text-highlighted leading-snug">
      {{ card.client_name }}
    </p>

    <div
      v-if="showDocInputs"
      class="flex items-center gap-1.5"
      @click.stop
    >
      <UInput
        v-model="remittanceFolio"
        class="min-w-0 flex-1"
        placeholder="Remisión (OC)"
        size="sm"
        variant="subtle"
      />
      <UInput
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
