<script setup lang="ts">
import type { CatalogDropdownFetcher } from '~/composables/useCatalogDropdown';
import type { RescueQuoteLine, RescueServiceType } from '~/interfaces/rescue';
import type { RescueCompanySettings } from '~/interfaces/rescue/company-settings';
import type { QuoteClassifierApplyPayload } from '~/interfaces/rescue/quote-classifier';
import type { ClientCreditSnapshot } from '~/schemas/rescue-create';
import {
  QUOTE_EDITOR_TAB_ITEMS,
  type QuoteEditorTabValue,
} from '~/constants/quote-editor-tabs';
import { DEFAULT_IVA_RATE } from '~/constants/quote-pricing';
import {
  applyContractToLine,
  clearContractFromLine,
  findContractItemForService,
  isContractLine,
} from '~/utils/rescue-company-settings';

const props = defineProps<{
  clientId: number | undefined;
  clientName?: string;
  clientCreditSnapshot?: ClientCreditSnapshot | null;
  serviceType: RescueServiceType;
  fetchServiceDropdown: CatalogDropdownFetcher;
}>();

const quoteLines = defineModel<RescueQuoteLine[]>('quoteLines', { required: true });
const companySettings = defineModel<RescueCompanySettings | null>('companySettings', {
  default: null,
});

const toast = useToast();
const activeEditorTab = ref<QuoteEditorTabValue>('lines');
const clientIdRef = computed(() => props.clientId);
const { settings, pending, error } = useRescueCompanySettings(clientIdRef);

const ivaPercentLabel = computed(() => formatIvaPercent(DEFAULT_IVA_RATE));

const quoteOptional = computed(() =>
  isQuoteOptionalForServiceType(props.serviceType),
);

const hasQuoteLines = computed(() => quoteLines.value.length > 0);

const showCreditBadge = computed(
  () =>
    props.clientCreditSnapshot != null
    && isWizardCreditClient(props.clientCreditSnapshot),
);

const priceMultiplierLabel = computed(() => {
  const multiplier = settings.value?.commissions.price_multiplier ?? 1;
  return `${Number(multiplier).toFixed(2)}x`;
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

const {
  showBreakdown: showQuotePricingDevBreakdown,
  breakdownMode: quotePricingDevBreakdownMode,
  registerShortcut: registerQuoteDevUnlockShortcut,
  unregisterShortcut: unregisterQuoteDevUnlockShortcut,
} = useQuotePricingDevUnlock();

onMounted(registerQuoteDevUnlockShortcut);
onBeforeUnmount(unregisterQuoteDevUnlockShortcut);

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
  activeEditorTab.value = 'lines';
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
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-wrap items-center gap-2 text-sm">
        <span class="text-muted">Cliente:</span>
        <span class="font-semibold text-highlighted">
          {{ clientName?.trim() || `Cliente #${clientId}` }}
        </span>
        <UBadge
          v-if="showCreditBadge"
          color="neutral"
          variant="subtle"
          size="sm"
          label="CREDITO"
        />
      </div>
      <UBadge color="primary" variant="subtle" size="md">
        Multiplicador: {{ priceMultiplierLabel }}
      </UBadge>
    </div>

    <UTabs
      v-model="activeEditorTab"
      :items="[...QUOTE_EDITOR_TAB_ITEMS]"
      variant="pill"
      :unmount-on-hide="false"
      class="w-full flex flex-col gap-4"
    >
      <template #lines />

      <template #prompt>
        <OperationalRescueQuoteAiPromptPanel
          @apply-lines="onApplyClassifierLines"
        />
      </template>

      <template #voice>
        <OperationalRescueQuoteAiVoicePanel
          @apply-lines="onApplyClassifierLines"
        />
      </template>
    </UTabs>

    <div class="space-y-3">
      <div
        v-if="hasQuoteLines"
        class="overflow-x-auto rounded-lg border border-default"
      >
        <table class="w-full min-w-[640px] text-sm sm:min-w-[960px]">
          <thead>
            <tr class="border-b border-default bg-elevated/50 text-left text-xs uppercase tracking-wide text-muted">
              <th class="px-3 py-2 font-medium">Servicio</th>
              <th class="w-24 px-3 py-2 font-medium">Cantidad</th>
              <th class="hidden px-3 py-2 font-medium sm:table-cell sm:w-36">Costo unit.</th>
              <th class="w-40 px-3 py-2 font-medium">P. unitario</th>
              <th class="w-32 px-3 py-2 font-medium text-right">Total</th>
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
              <td class="hidden px-3 py-2 align-top sm:table-cell">
                <UFormField :name="`quote_lines.${index}.unit_cost`" required>
                  <UInputNumber
                    v-model="line.unit_cost"
                    v-bind="catalogCurrencyInputProps"
                    :min="0"
                  />
                </UFormField>
              </td>
              <td class="px-3 py-2 align-top">
                <span class="block text-[10px] font-medium uppercase tracking-wide text-muted">
                  Multiplic.
                </span>
                <span class="font-medium tabular-nums">
                  {{ formatQuoteMoney(lineRow(line)?.afterMultiplier ?? 0) }}
                </span>
              </td>
              <td class="px-3 py-2 align-top text-right">
                <span class="font-semibold tabular-nums text-primary">
                  {{ formatQuoteMoney(lineRow(line)?.lineTotal ?? 0) }}
                </span>
                <span
                  v-if="lineRow(line)?.roundingAdd"
                  class="mt-1 block text-xs text-muted tabular-nums"
                >
                  +{{ formatQuoteMoney(lineRow(line)!.roundingAdd) }} redondeo
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

      <button
        type="button"
        class="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-default px-4 py-3 text-sm font-medium text-muted transition-colors hover:border-primary hover:text-primary disabled:pointer-events-none disabled:opacity-50"
        @click="addLine"
      >
        <UIcon name="i-lucide-plus" class="size-4" />
        Agregar renglón
      </button>

      <div
        v-if="hasQuoteLines"
        class="ml-auto w-full max-w-xs space-y-2 text-sm"
      >
        <div class="flex justify-between gap-4">
          <span class="text-muted">Conceptos</span>
          <span class="tabular-nums">
            {{ formatQuoteMoney(pricing.costSubtotal) }}
          </span>
        </div>
        <div class="flex justify-between gap-4">
          <span class="text-muted">Subtotal</span>
          <span class="tabular-nums">
            {{ formatQuoteMoney(pricing.subtotalLines) }}
          </span>
        </div>
        <div class="flex justify-between gap-4">
          <span class="text-muted">IVA ({{ ivaPercentLabel }})</span>
          <span class="tabular-nums">
            {{ formatQuoteMoney(pricing.ivaAmount) }}
          </span>
        </div>
        <div class="flex justify-between gap-4 border-t border-default pt-2">
          <span class="font-semibold">TOTAL</span>
          <span class="text-lg font-bold tabular-nums text-primary">
            {{ formatQuoteMoney(pricing.totalCharged) }}
          </span>
        </div>
      </div>

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

      <OperationalRescueRequestQuotePricingDevBreakdown
        v-if="showQuotePricingDevBreakdown"
        :pricing="pricing"
        :settings="settings"
        :mode="quotePricingDevBreakdownMode ?? 'dev'"
      />
    </div>
  </div>
</template>
