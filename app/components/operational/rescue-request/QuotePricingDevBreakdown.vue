<script setup lang="ts">
import { COMMISSION_TYPE_OPTIONS } from '~/constants/catalog-select-options';
import {
  DEFAULT_IVA_RATE,
  QUOTE_DEV_BREAKDOWN_COPY,
  QUOTE_DEV_UNLOCK_COPY,
  QUOTE_SUMMARY_LABELS,
} from '~/constants/quote-pricing';
import type { RescueCompanySettings } from '~/interfaces/rescue/company-settings';
import type { QuotePricingDevBreakdownMode } from '~/utils/quote-pricing-dev-unlock';
import {
  isFilledQuoteLine,
  type QuoteLinePricing,
  type QuotePricingSummary,
} from '~/utils/quote-pricing';

const props = defineProps<{
  pricing: QuotePricingSummary;
  settings: RescueCompanySettings | null;
  ivaRate?: number;
  mode?: QuotePricingDevBreakdownMode;
}>();

const devCopy = QUOTE_DEV_BREAKDOWN_COPY;

const panelTitle = computed(() =>
  props.mode === 'admin'
    ? QUOTE_DEV_UNLOCK_COPY.panelTitleAdmin
    : QUOTE_DEV_UNLOCK_COPY.panelTitleDev,
);

const showAdminShortcutHint = computed(() => props.mode === 'admin');

const ivaRate = computed(() => props.ivaRate ?? DEFAULT_IVA_RATE);
const ivaPercentLabel = computed(() => formatIvaPercent(ivaRate.value));

const commissionTypeLabel = computed(() => {
  const type = props.settings?.commissions.commission_type;
  if (type == null) return '—';
  return (
    COMMISSION_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type
  );
});

const standardAfterMultSum = computed(() =>
  props.pricing.lines
    .filter((row) => isFilledQuoteLine(row.line) && !row.isContractLine)
    .reduce((sum, row) => sum + row.afterMultiplier, 0),
);

const sellerCommissionRule = computed(() => {
  const commissions = props.settings?.commissions;
  if (commissions == null) return null;
  if (commissions.commission_type === 'FIXED') {
    return devCopy.ruleSellerFixed;
  }
  return devCopy.ruleSellerPercent;
});

function fixedShareExplanation(row: QuoteLinePricing): string | null {
  if (row.isContractLine || row.fixedShare <= 0 || !props.settings) {
    return null;
  }
  const pool = props.settings.commissions.commission_fixed;
  const sum = standardAfterMultSum.value;
  if (sum <= 0) return null;
  const pct = ((row.afterMultiplier / sum) * 100).toFixed(1);
  return `${devCopy.fixedShareLinePrefix} (${formatQuoteMoney(pool)} total; esta partida ${pct}% del subtotal tras multiplicador) → ${formatQuoteMoney(row.fixedShare)} ${devCopy.fixedShareLineSuffix}`;
}

function sellerFixedShareExplanation(row: QuoteLinePricing): string | null {
  if (
    row.isContractLine
    || row.sellerFixedShare <= 0
    || !props.settings
    || props.settings.commissions.commission_type !== 'FIXED'
  ) {
    return null;
  }
  const pool = props.settings.commissions.commission_value;
  const sum = standardAfterMultSum.value;
  if (sum <= 0) return null;
  const pct = ((row.afterMultiplier / sum) * 100).toFixed(1);
  return `${devCopy.sellerFixedShareLinePrefix} (${formatQuoteMoney(pool)} total; esta partida ${pct}% del subtotal tras multiplicador) → ${formatQuoteMoney(row.sellerFixedShare)} ${devCopy.sellerFixedShareLineSuffix}`;
}

const sellerCommissionDetail = computed(() => {
  const commissions = props.settings?.commissions;
  if (commissions == null) {
    return 'Sin ajustes de cliente: no se calcula comisión vendedor.';
  }

  if (commissions.commission_type === 'FIXED') {
    return [
      `Tipo FIXED: ${formatQuoteMoney(commissions.commission_value)} repartido en partidas estándar.`,
      `Σ comisión embebida en líneas = ${formatQuoteMoney(props.pricing.sellerCommission)}.`,
      'Ya está incluida en el subtotal (Σ total línea); no se suma aparte antes de IVA.',
    ].join(' ');
  }

  if (props.pricing.profit <= 0) {
    return [
      `Tipo PERCENTAGE: ${commissions.commission_value}% × utilidad ${formatQuoteMoney(props.pricing.profit)} = $0.`,
      'No se suma al total del cliente.',
    ].join(' ');
  }

  return [
    `Tipo PERCENTAGE: ${commissions.commission_value}% × utilidad ${formatQuoteMoney(props.pricing.profit)} = ${formatQuoteMoney(props.pricing.sellerCommission)}.`,
    'Solo referencia interna (pagos al vendedor). No aparece en subtotal antes de IVA ni en total cotizado.',
    `La comisión fija de empresa (commission_fixed, ${formatQuoteMoney(commissions.commission_fixed)}) ya está embebida en las líneas.`,
  ].join(' ');
});

const beforeTaxDetail = computed(() => {
  const sub = formatQuoteMoney(props.pricing.subtotalLines);
  return `${sub} (Σ total línea) = ${formatQuoteMoney(props.pricing.totalBeforeTax)}`;
});

const totalChargedDetail = computed(() => {
  const before = formatQuoteMoney(props.pricing.totalBeforeTax);
  const iva = formatQuoteMoney(props.pricing.ivaAmount);
  const total = formatQuoteMoney(props.pricing.totalCharged);
  return `${before} + IVA ${ivaPercentLabel.value} (${iva}) = ${total}`;
});
</script>

<template>
  <details
    class="mt-4 rounded-lg border border-dashed border-amber-500/50 bg-amber-500/5 text-xs"
  >
    <summary
      class="cursor-pointer select-none px-3 py-2 font-semibold text-amber-600 dark:text-amber-400"
    >
      {{ panelTitle }}
    </summary>

    <p
      v-if="showAdminShortcutHint"
      class="border-t border-amber-500/20 px-3 py-1.5 text-[11px] text-muted"
    >
      {{ QUOTE_DEV_UNLOCK_COPY.panelHintAdmin }}
    </p>

    <div class="space-y-3 border-t border-amber-500/20 px-3 pb-3 pt-2">
      <section
        v-if="settings"
        class="space-y-1.5 rounded border border-amber-500/30 bg-amber-500/10 p-2"
      >
        <p class="font-semibold text-amber-700 dark:text-amber-300">
          {{ devCopy.rulesTitle }}
        </p>
        <p class="text-muted">
          {{ devCopy.rulesIntro }}
        </p>
        <ul class="list-inside list-disc space-y-1 text-muted">
          <li>{{ devCopy.ruleEmbeddedFixed }}</li>
          <li>{{ devCopy.ruleMultiplier }}</li>
          <li v-if="sellerCommissionRule">
            {{ sellerCommissionRule }}
          </li>
        </ul>
      </section>

      <section v-if="settings" class="space-y-1">
        <p class="font-medium text-muted">
          Ajustes del cliente
        </p>
        <ul class="list-inside list-disc space-y-0.5 text-muted">
          <li>
            {{ devCopy.sellerCommissionTypeLabel }}:
            <strong class="text-default">{{ commissionTypeLabel }}</strong>
            ({{ settings.commissions.commission_type }})
          </li>
          <li>
            {{ devCopy.sellerCommissionValueLabel }}:
            <strong class="tabular-nums text-default">
              {{ settings.commissions.commission_value }}
            </strong>
            <span v-if="settings.commissions.commission_type === 'PERCENTAGE'">
              % sobre utilidad
            </span>
            <span v-else>
              (monto repartido en partidas)
            </span>
          </li>
          <li>
            {{ devCopy.embeddedFixedLabel }}:
            <strong class="tabular-nums text-default">
              {{ formatQuoteMoney(settings.commissions.commission_fixed) }}
            </strong>
          </li>
          <li>
            Multiplicador de precio:
            <strong class="tabular-nums text-default">
              {{ settings.commissions.price_multiplier }}
            </strong>
          </li>
          <li>
            Multiplicador de préstamo:
            <strong class="tabular-nums text-default">
              {{ settings.commissions.loan_multiplier }}
            </strong>
          </li>
          <li v-if="settings.contract">
            Convenio #{{ settings.contract.id }} ({{
              settings.contract.items.length
            }}
            ítems)
          </li>
        </ul>
      </section>
      <p v-else class="text-muted">
        Sin ajustes del cliente en memoria.
      </p>

      <section v-if="pricing.lines.length > 0" class="space-y-2">
        <p class="font-medium text-muted">
          Por línea
        </p>
        <div
          v-for="row in pricing.lines"
          :key="row.line.id"
          class="rounded border border-default/60 bg-elevated/30 p-2"
        >
          <p class="font-medium">
            {{
              row.line.service.label
                || (row.line.service.value
                  ? `Servicio #${row.line.service.value}`
                  : 'Sin servicio')
            }}
            <UBadge
              v-if="row.isContractLine"
              class="ml-1"
              color="primary"
              variant="subtle"
              size="xs"
              label="Convenio"
            />
          </p>
          <ul
            v-if="isFilledQuoteLine(row.line)"
            class="mt-1 space-y-0.5 tabular-nums text-muted"
          >
            <li>
              Cantidad × pago unitario → base:
              {{ row.line.quantity }} ×
              {{ formatQuoteMoney(row.line.unit_cost) }} =
              {{ formatQuoteMoney(row.baseFinal) }}
            </li>
            <li v-if="!row.isContractLine">
              Tras multiplicador →
              {{ formatQuoteMoney(row.afterMultiplier) }}
            </li>
            <li v-if="fixedShareExplanation(row)">
              {{ fixedShareExplanation(row) }}
            </li>
            <li v-if="sellerFixedShareExplanation(row)">
              {{ sellerFixedShareExplanation(row) }}
            </li>
            <li v-if="row.isContractLine">
              {{ devCopy.contractLineNote }}
            </li>
            <li>
              {{ QUOTE_SUMMARY_LABELS.technicalCost }} línea:
              {{ formatQuoteMoney(row.costSubtotal) }}
            </li>
            <li>
              Total calculado (antes de redondeo):
              {{ formatQuoteMoney(row.lineTotalCalculated) }}
            </li>
            <li v-if="row.isAppliedPriceCustom">
              Precio a aplicar (custom):
              {{ formatQuoteMoney(row.appliedPrice) }}
            </li>
            <li v-if="row.roundingAdd !== 0">
              Redondeo al diez:
              {{ row.roundingAdd > 0 ? '+' : ''
              }}{{ formatQuoteMoney(row.roundingAdd) }}
            </li>
            <li>
              Total línea ({{ QUOTE_SUMMARY_LABELS.subtotal }} partida, lo que
              suma al cliente):
              <strong class="text-default">
                {{ formatQuoteMoney(row.lineTotal) }}
              </strong>
            </li>
          </ul>
          <p v-else class="mt-1 text-muted">
            Sin servicio: no se aplican comisiones ni totales.
          </p>
        </div>
      </section>

      <section class="space-y-1 border-t border-default/60 pt-2">
        <p class="font-medium text-muted">
          Totales
        </p>
        <ul class="space-y-1 tabular-nums text-muted">
          <li>
            {{ QUOTE_SUMMARY_LABELS.technicalCost }} = Σ costo línea →
            <strong class="text-default">
              {{ formatQuoteMoney(pricing.costSubtotal) }}
            </strong>
          </li>
          <li>
            {{ QUOTE_SUMMARY_LABELS.subtotal }} = Σ total línea →
            <strong class="text-default">
              {{ formatQuoteMoney(pricing.subtotalLines) }}
            </strong>
            <span class="block text-[11px] text-muted/90">
              (incluye multiplicador, comisión fija de empresa, comisión vendedor
              fija repartida y redondeo al diez)
            </span>
          </li>
          <li v-if="pricing.roundingAddTotal !== 0">
            Σ ajuste redondeo al diez →
            <strong class="text-default">
              {{ pricing.roundingAddTotal > 0 ? '+' : ''
              }}{{ formatQuoteMoney(pricing.roundingAddTotal) }}
            </strong>
          </li>
          <li>
            {{ QUOTE_SUMMARY_LABELS.utility }} = subtotal − costo técnico →
            <strong class="text-default">
              {{ formatQuoteMoney(pricing.profit) }}
            </strong>
          </li>
          <li class="rounded border border-default/50 bg-elevated/20 p-1.5">
            <span class="font-medium text-default">Comisión vendedor</span>
            <span class="block mt-0.5">{{ sellerCommissionDetail }}</span>
          </li>
          <li>
            {{ QUOTE_SUMMARY_LABELS.beforeTax }} = {{ beforeTaxDetail }}
          </li>
          <li>
            IVA {{ ivaPercentLabel }} sobre subtotal antes de IVA →
            <strong class="text-default">
              {{ formatQuoteMoney(pricing.ivaAmount) }}
            </strong>
          </li>
          <li>
            {{ QUOTE_SUMMARY_LABELS.totalQuoted }} = {{ totalChargedDetail }}
          </li>
        </ul>
      </section>
    </div>
  </details>
</template>
