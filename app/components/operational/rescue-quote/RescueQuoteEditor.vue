<script setup lang="ts">
import type { CatalogDropdownFetcher } from '~/composables/useCatalogDropdown';
import type { RescueQuoteLine, RescueServiceType } from '~/interfaces/rescue';
import type { RescueCompanySettings } from '~/interfaces/rescue/company-settings';
import type { QuoteClassifierApplyPayload } from '~/interfaces/rescue/quote-classifier';
import type { ClientCreditSnapshot } from '~/schemas/rescue-create';
import { QUOTE_EDITOR_TAB_ITEMS } from '~/constants/quote-editor-tabs';
import { DEFAULT_IVA_RATE, QUOTE_SUMMARY_LABELS } from '~/constants/quote-pricing';
import {
  applyContractToLine,
  clearContractFromLine,
  findContractItemForService,
  isContractLine,
} from '~/utils/rescue-company-settings';

const props = defineProps<{
  clientId: number | undefined;
  clientCreditSnapshot?: ClientCreditSnapshot | null;
  serviceType: RescueServiceType;
  fetchServiceDropdown: CatalogDropdownFetcher;
}>();

const quoteLines = defineModel<RescueQuoteLine[]>('quoteLines', { required: true });
const companySettings = defineModel<RescueCompanySettings | null>('companySettings', {
  default: null,
});

const toast = useToast();
const activeQuoteTab = ref<'lines' | 'ai'>('lines');
const clientIdRef = computed(() => props.clientId);
const { settings, pending, error } = useRescueCompanySettings(clientIdRef);

const ivaPercentLabel = computed(() => formatIvaPercent(DEFAULT_IVA_RATE));

const quoteOptional = computed(() =>
  isQuoteOptionalForServiceType(props.serviceType),
);

const hasQuoteLines = computed(() => quoteLines.value.length > 0);

const sellerCommissionLabel = computed(() => {
  const type = settings.value?.commissions.commission_type;
  if (type === 'FIXED') {
    return QUOTE_SUMMARY_LABELS.sellerCommissionFixed;
  }
  const pct = settings.value?.commissions.commission_value;
  if (pct != null) {
    return `${QUOTE_SUMMARY_LABELS.sellerCommissionPercent} (${pct}% de utilidad)`;
  }
  return QUOTE_SUMMARY_LABELS.sellerCommissionPercent;
});

watch(
  settings,
  (value) => {
    companySettings.value = value;
  },
  { immediate: true },
);

watch(error, (err) => {
  if (err == null) return;
  toast.add({
    title: 'No se pudieron cargar los ajustes del cliente',
    description: err.message,
    color: 'error',
  });
});

watch(
  () => props.clientId,
  (newId, oldId) => {
    if (oldId != null && newId !== oldId) {
      for (const line of quoteLines.value) {
        clearContractFromLine(line);
      }
    }
  },
);

const pricing = computed(() =>
  computeQuotePricing(quoteLines.value, settings.value),
);

const hasFilledLines = computed(() =>
  quoteLinesHaveFilledEntries(quoteLines.value),
);

const creditWarning = computed(() =>
  getClientQuoteCreditWarning(
    props.clientCreditSnapshot,
    pricing.value.totalCharged,
    hasFilledLines.value,
  ),
);

const creditAvailableLabel = computed(() => {
  const snapshot = props.clientCreditSnapshot;
  if (snapshot == null || !isWizardCreditClient(snapshot)) return null;
  const available = snapshot.credit_available;
  if (available == null || !Number.isFinite(available)) return null;
  return `Crédito disponible: ${formatClientMoney(available)}`;
});

function lineRow(line: RescueQuoteLine) {
  return pricing.value.lines.find((row) => row.line.id === line.id);
}

function syncLineContract(line: RescueQuoteLine) {
  if (line.service_id == null) {
    clearContractFromLine(line);
    return;
  }

  const item = findContractItemForService(settings.value, line.service_id);
  if (item) {
    applyContractToLine(line, item);
    return;
  }

  if (line.contract_item_id != null) {
    clearContractFromLine(line);
  }
}

function addLine() {
  quoteLines.value.push(createEmptyQuoteLine());
}

function removeLine(id: string) {
  if (!quoteOptional.value && quoteLines.value.length <= 1) return;
  quoteLines.value = quoteLines.value.filter((row) => row.id !== id);
}

function canRemoveLine(): boolean {
  return quoteOptional.value || quoteLines.value.length > 1;
}

function onApplyClassifierLines(payload: QuoteClassifierApplyPayload) {
  quoteLines.value = [...quoteLines.value, ...payload.lines];
  activeQuoteTab.value = 'lines';
}

watch(
  () => quoteLines.value.map((line) => line.service_id),
  () => {
    for (const line of quoteLines.value) {
      syncLineContract(line);
    }
  },
  { deep: true },
);

watch(
  () => quoteLines.value.map((l) => l.service_id),
  async (ids, _prev, onCleanup) => {
    let active = true;
    onCleanup(() => {
      active = false;
    });

    for (const [i, line] of quoteLines.value.entries()) {
      const id = ids[i];
      if (id == null) {
        if (active) line.service_label = '';
        continue;
      }
      if (isContractLine(line)) continue;

      try {
        const raw = await $fetch<Record<string, unknown>>(
          `/api/catalogue/service/detail/${id}/`,
        );
        if (!active) return;
        line.service_label =
          String(raw.name ?? '').trim() || `Servicio #${id}`;
      } catch {
        if (!active) return;
        line.service_label = `Servicio #${id}`;
      }
    }
  },
  { deep: true },
);
</script>

<template>
  <div
    v-if="clientId == null"
    class="rounded-lg border border-default bg-elevated/30 px-4 py-6 text-center text-sm text-muted"
  >
    No hay cliente asociado a esta solicitud.
  </div>

  <div
    v-else-if="pending && settings == null"
    class="flex items-center gap-2 text-sm text-muted"
  >
    <UIcon name="i-lucide-loader-circle" class="size-4 animate-spin" />
    Cargando ajustes del cliente…
  </div>

  <div v-else class="space-y-4">
    <p class="text-sm text-muted">
      <template v-if="quoteOptional">
        La cotización es opcional: puedes continuar sin partidas o agregar
        servicios si ya conoces precios.
      </template>
      <template v-else>
        Agrega al menos un servicio en la cotización.
      </template>
      Por ítem se aplican multiplicador y comisión fija; la comisión del vendedor
      se calcula sobre la ganancia. Las líneas con convenio parten del precio del
      convenio y puedes ajustarlo. IVA
      provisional {{ ivaPercentLabel }} sobre el total antes de impuestos.
    </p>

    <UTabs
      v-model="activeQuoteTab"
      :items="[...QUOTE_EDITOR_TAB_ITEMS]"
      variant="pill"
      :unmount-on-hide="false"
      class="w-full flex flex-col gap-4"
    >
      <template #lines>
        <div class="space-y-4 pt-2">
          <div
            v-if="!hasQuoteLines"
            class="flex flex-col items-center gap-3 rounded-lg border border-dashed border-default px-4 py-10 text-center text-sm text-muted"
          >
            <p>Sin partidas de cotización.</p>
            <UButton
              type="button"
              color="primary"
              variant="soft"
              icon="i-lucide-plus"
              label="Agregar servicio"
              @click="addLine"
            />
          </div>

          <div
            v-else
            class="overflow-x-auto rounded-lg border border-default"
          >
            <table class="w-full min-w-[900px] text-sm">
              <thead>
                <tr class="border-b border-default bg-elevated/50 text-left text-xs text-muted">
                  <th class="px-3 py-2 font-medium">Servicio</th>
                  <th class="w-24 px-3 py-2 font-medium">Cantidad</th>
                  <th class="w-36 px-3 py-2 font-medium">Pago unitario</th>
                  <th class="w-36 px-3 py-2 font-medium text-right">Total cliente</th>
                  <th class="w-10 px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(line, index) in quoteLines"
                  :key="line.id"
                  class="border-b border-default last:border-b-0"
                >
                  <td class="px-3 py-2 align-top">
                    <div class="space-y-2">
                      <UFormField
                        :name="`quote_lines.${index}.service_id`"
                        class="min-w-48"
                        required
                      >
                        <CatalogDropdownSelect
                          v-model="line.service_id"
                          placeholder="Buscar servicio"
                          :fetcher="fetchServiceDropdown"
                        />
                      </UFormField>
                      <p
                        v-if="line.service_id == null && line.service_label.trim()"
                        class="text-xs text-muted"
                      >
                        Sugerido: {{ line.service_label }}
                      </p>
                      <UBadge
                        v-if="isContractLine(line)"
                        color="primary"
                        variant="subtle"
                        size="sm"
                        label="Convenio"
                      />
                    </div>
                  </td>
                  <td class="px-3 py-2 align-top">
                    <UFormField :name="`quote_lines.${index}.quantity`" required>
                      <UInputNumber
                        v-model="line.quantity"
                        v-bind="catalogIntegerInputProps"
                        :min="0"
                      />
                    </UFormField>
                  </td>
                  <td class="px-3 py-2 align-top">
                    <UFormField :name="`quote_lines.${index}.unit_cost`" required>
                      <UInputNumber
                        v-model="line.unit_cost"
                        v-bind="catalogCurrencyInputProps"
                        :min="0"
                      />
                    </UFormField>
                    <span class="mt-1 block text-xs text-muted tabular-nums">
                      Costo línea:
                      {{ formatQuoteMoney(lineRow(line)?.costSubtotal ?? 0) }}
                    </span>
                  </td>
                  <td class="px-3 py-2 align-top text-right">
                    <span class="font-medium tabular-nums">
                      {{ formatQuoteMoney(lineRow(line)?.lineTotal ?? 0) }}
                    </span>
                    <span
                      v-if="lineRow(line)?.roundingAdd"
                      class="mt-1 block text-xs text-muted tabular-nums"
                    >
                      +{{ formatQuoteMoney(lineRow(line)!.roundingAdd) }}
                      redondeo al diez
                    </span>
                  </td>
                  <td class="px-2 py-2 align-top">
                    <UButton
                      type="button"
                      color="neutral"
                      variant="ghost"
                      icon="i-lucide-trash-2"
                      size="xs"
                      :disabled="!canRemoveLine()"
                      aria-label="Eliminar fila"
                      @click="removeLine(line.id)"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <UButton
            v-if="hasQuoteLines"
            type="button"
            color="neutral"
            variant="outline"
            icon="i-lucide-plus"
            label="Agregar servicio"
            @click="addLine"
          />

          <UCard
            v-if="hasQuoteLines"
            variant="subtle"
            :ui="{ body: 'space-y-2 text-sm' }"
          >
            <div class="flex justify-between gap-4">
              <span class="text-muted">{{ QUOTE_SUMMARY_LABELS.technicalCost }}</span>
              <span class="font-medium tabular-nums">
                {{ formatQuoteMoney(pricing.costSubtotal) }}
              </span>
            </div>
            <div class="flex justify-between gap-4">
              <span class="text-muted">{{ QUOTE_SUMMARY_LABELS.subtotal }}</span>
              <span class="tabular-nums">
                {{ formatQuoteMoney(pricing.subtotalLines) }}
              </span>
            </div>
            <div class="flex justify-between gap-4">
              <span class="text-muted">{{ QUOTE_SUMMARY_LABELS.utility }}</span>
              <span class="tabular-nums">
                {{ formatQuoteMoney(pricing.profit) }}
              </span>
            </div>
            <div
              v-if="pricing.sellerCommission > 0.001"
              class="flex justify-between gap-4"
            >
              <span class="text-muted">{{ sellerCommissionLabel }}</span>
              <span class="tabular-nums text-muted">
                <template v-if="pricing.sellerCommissionAddsToTotal">+</template>
                {{ formatQuoteMoney(pricing.sellerCommission) }}
              </span>
            </div>
            <div class="flex justify-between gap-4">
              <span class="text-muted">{{ QUOTE_SUMMARY_LABELS.beforeTax }}</span>
              <span class="tabular-nums">
                {{ formatQuoteMoney(pricing.totalBeforeTax) }}
              </span>
            </div>
            <div class="flex justify-between gap-4">
              <span class="text-muted">IVA ({{ ivaPercentLabel }})</span>
              <span class="tabular-nums text-muted">
                +{{ formatQuoteMoney(pricing.ivaAmount) }}
              </span>
            </div>
            <div class="flex justify-between gap-4 border-t border-default pt-2">
              <span class="font-medium">{{ QUOTE_SUMMARY_LABELS.totalQuoted }}</span>
              <span class="text-base font-semibold tabular-nums text-primary">
                {{ formatQuoteMoney(pricing.totalCharged) }}
              </span>
            </div>
          </UCard>

          <UAlert
            v-if="creditWarning"
            color="error"
            variant="subtle"
            :title="creditWarning.title"
            :description="creditWarning.description"
            icon="i-lucide-circle-alert"
          />

          <p
            v-else-if="creditAvailableLabel && hasFilledLines"
            class="text-sm text-muted"
          >
            {{ creditAvailableLabel }}
          </p>

          <DevOnly>
            <OperationalRescueRequestQuotePricingDevBreakdown
              :pricing="pricing"
              :settings="settings"
            />
          </DevOnly>
        </div>
      </template>

      <template #ai>
        <OperationalRescueQuoteAiPromptTab
          class="pt-2"
          @apply-lines="onApplyClassifierLines"
        />
      </template>
    </UTabs>
  </div>
</template>
