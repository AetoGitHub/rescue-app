<script setup lang="ts">
import type { RescueRequestFormState } from '~/schemas/rescue-create';
import { DEFAULT_IVA_RATE, QUOTE_SUMMARY_LABELS } from '~/constants/quote-pricing';
import { RESCUE_SERVICE_TYPE_OPTIONS } from '~/constants/rescue-select-options';
import { parseRescueCoord } from '~/schemas/rescue-create';

const state = defineModel<RescueRequestFormState>({ required: true });

const quotePricing = computed(() =>
  computeQuotePricing(state.value.quote_lines, state.value.company_settings, {
    clientSellerId: state.value.client_seller_id,
    serviceType: state.value.service_type,
  }),
);

const ivaPercentLabel = computed(() => formatIvaPercent(DEFAULT_IVA_RATE));

const sellerCommissionLabel = computed(() => {
  const type = state.value.company_settings?.commissions.commission_type;
  if (type === 'FIXED') {
    return QUOTE_SUMMARY_LABELS.sellerCommissionFixed;
  }
  const pct = state.value.company_settings?.commissions.commission_value;
  if (pct != null) {
    return `${QUOTE_SUMMARY_LABELS.sellerCommissionPercent} (${pct}% de utilidad)`;
  }
  return QUOTE_SUMMARY_LABELS.sellerCommissionPercent;
});

const serviceTypeOption = computed(() =>
  RESCUE_SERVICE_TYPE_OPTIONS.find((o) => o.value === state.value.service_type),
);

const locationCoordsLabel = computed(() => {
  const lat = parseRescueCoord(state.value.location_latitude);
  const lng = parseRescueCoord(state.value.location_longitude);
  if (lat == null || lng == null) return '—';
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
});

const quoteCreditWarning = computed(() =>
  getWizardQuoteCreditWarning(
    state.value.client_credit_snapshot,
    state.value.quote_lines,
    state.value.company_settings,
    state.value.client_seller_id,
  ),
);

const {
  showBreakdown: showQuotePricingDevBreakdown,
  breakdownMode: quotePricingDevBreakdownMode,
  registerShortcut: registerQuoteDevUnlockShortcut,
  unregisterShortcut: unregisterQuoteDevUnlockShortcut,
} = useQuotePricingDevUnlock();

onMounted(registerQuoteDevUnlockShortcut);
onBeforeUnmount(unregisterQuoteDevUnlockShortcut);
</script>

<template>
  <div class="space-y-4">
    <UCard variant="subtle" :ui="{ body: 'space-y-3 text-sm' }">
      <h3 class="text-xs font-semibold uppercase tracking-wider text-primary">
        Resumen
      </h3>

      <dl class="grid gap-2 sm:grid-cols-2">
        <div>
          <dt class="text-muted">Tipo de solicitud</dt>
          <dd class="flex items-center gap-2 font-medium">
            <UIcon
              v-if="serviceTypeOption?.icon"
              :name="serviceTypeOption.icon"
              class="size-4"
            />
            {{ serviceTypeOption?.label ?? state.service_type }}
          </dd>
        </div>
        <div>
          <dt class="text-muted">Cliente</dt>
          <dd class="font-medium">
            {{
              state.client.label
              || (state.client.value != null ? `Cliente #${state.client.value}` : '—')
            }}
          </dd>
        </div>
        <div v-if="state.serialNumber">
          <dt class="text-muted">Número económico</dt>
          <dd class="font-medium">{{ state.serialNumber }}</dd>
        </div>
        <div v-if="state.general_public">
          <dt class="text-muted">Público en general</dt>
          <dd class="font-medium">Sí</dd>
        </div>
        <div v-if="state.manager.value != null">
          <dt class="text-muted">Gestor</dt>
          <dd class="font-medium">
            {{ state.manager.label || `Usuario #${state.manager.value}` }}
          </dd>
        </div>
        <div class="sm:col-span-2">
          <dt class="text-muted">Ubicación</dt>
          <dd class="font-medium">
            {{ state.location_description || '—' }}
            <span class="mt-0.5 block text-xs text-muted">
              {{ locationCoordsLabel }}
            </span>
          </dd>
        </div>
        <div class="sm:col-span-2">
          <dt class="text-muted">Descripción del servicio</dt>
          <dd class="font-medium whitespace-pre-wrap">
            {{ state.service_description || '—' }}
          </dd>
        </div>
        <div>
          <dt class="text-muted">Proveedor</dt>
          <dd class="font-medium">
            {{
              state.supplierLabel
                || (state.supplier ? `Proveedor #${state.supplier}` : 'Sin proveedor')
            }}
          </dd>
        </div>
      </dl>
    </UCard>

    <UCard
      v-if="quotePricing.lines.length > 0"
      variant="subtle"
      :ui="{ body: 'space-y-3 text-sm' }"
    >
      <h3 class="text-xs font-semibold uppercase tracking-wider text-primary">
        Cotización
      </h3>
      <ul class="divide-y divide-default">
        <li
          v-for="row in quotePricing.lines"
          :key="row.line.id"
          class="flex flex-wrap items-baseline justify-between gap-2 py-2 first:pt-0 last:pb-0"
        >
          <span class="font-medium">
            {{ row.line.service.label || `Servicio #${row.line.service.value}` }}
            <span class="font-normal text-muted">
              × {{ row.line.quantity }}
            </span>
            <UBadge
              v-if="row.isContractLine"
              class="ml-1"
              color="primary"
              variant="subtle"
              size="xs"
              label="Convenio"
            />
          </span>
          <span class="tabular-nums text-right">
            <span class="block text-xs text-muted">
              {{ formatQuoteMoney(row.costSubtotal) }}
            </span>
            {{ formatQuoteMoney(row.lineTotal) }}
          </span>
        </li>
      </ul>
      <div class="flex justify-between gap-4 text-muted">
        <span>{{ QUOTE_SUMMARY_LABELS.technicalCost }}</span>
        <span class="tabular-nums">
          {{ formatQuoteMoney(quotePricing.costSubtotal) }}
        </span>
      </div>
      <div class="flex justify-between gap-4 text-muted">
        <span>{{ QUOTE_SUMMARY_LABELS.subtotal }}</span>
        <span class="tabular-nums">
          {{ formatQuoteMoney(quotePricing.subtotalLines) }}
        </span>
      </div>
      <div class="flex justify-between gap-4 text-muted">
        <span>{{ QUOTE_SUMMARY_LABELS.utility }}</span>
        <span class="tabular-nums">
          {{ formatQuoteMoney(quotePricing.profit) }}
        </span>
      </div>
      <div
        v-if="quotePricing.sellerCommission > 0.001"
        class="flex justify-between gap-4 text-muted"
      >
        <span>{{ sellerCommissionLabel }}</span>
        <span class="tabular-nums">
          <template v-if="quotePricing.sellerCommissionAddsToTotal">+</template>
          {{ formatQuoteMoney(quotePricing.sellerCommission) }}
        </span>
      </div>
      <div class="flex justify-between gap-4 text-muted">
        <span>{{ QUOTE_SUMMARY_LABELS.beforeTax }}</span>
        <span class="tabular-nums">
          {{ formatQuoteMoney(quotePricing.totalBeforeTax) }}
        </span>
      </div>
      <div class="flex justify-between gap-4 text-muted">
        <span>IVA ({{ ivaPercentLabel }})</span>
        <span class="tabular-nums">
          +{{ formatQuoteMoney(quotePricing.ivaAmount) }}
        </span>
      </div>
      <div class="flex justify-between gap-4 border-t border-default pt-2 font-medium">
        <span>{{ QUOTE_SUMMARY_LABELS.totalQuoted }}</span>
        <span class="tabular-nums text-primary">
          {{ formatQuoteMoney(quotePricing.totalCharged) }}
        </span>
      </div>
    </UCard>

    <UAlert
      v-if="quoteCreditWarning"
      color="error"
      variant="subtle"
      :title="quoteCreditWarning.title"
      :description="quoteCreditWarning.description"
      icon="i-lucide-circle-alert"
    />

    <OperationalRescueRequestQuotePricingDevBreakdown
      v-if="showQuotePricingDevBreakdown && quotePricing.lines.length > 0"
      :pricing="quotePricing"
      :settings="state.company_settings"
      :mode="quotePricingDevBreakdownMode ?? 'dev'"
    />

    <UFormField label="Nota interna" name="internal_notes">
      <UTextarea v-model="state.internal_notes" class="w-full" :rows="4" />
    </UFormField>
  </div>
</template>
