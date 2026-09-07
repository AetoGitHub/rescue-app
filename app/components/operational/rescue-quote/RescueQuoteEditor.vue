<script setup lang="ts">
import type { CatalogDropdownFetcher } from '~/composables/useCatalogDropdown';
import { catalogDropdownSelection } from '~/interfaces/shared/catalog-dropdown.interface';
import type { RescueQuoteLine, RescueServiceType } from '~/interfaces/rescue';
import type { RescueCompanySettings } from '~/interfaces/rescue/company-settings';
import type { QuoteClassifierApplyPayload } from '~/interfaces/rescue/quote-classifier';
import type { ClientCreditSnapshot } from '~/schemas/rescue-create';
import {
  QUOTE_EDITOR_TAB_ITEMS,
  type QuoteEditorTabValue,
} from '~/constants/quote-editor-tabs';
import {
  DEFAULT_IVA_RATE,
  QUOTE_DEV_UNLOCK_COPY,
  QUOTE_LINE_COLUMN_GROUPS,
  QUOTE_LINE_COLUMN_LABELS,
  QUOTE_SUMMARY_LABELS,
} from '~/constants/quote-pricing';
import {
  applyContractToLine,
  clearContractFromLine,
  findContractItemForService,
  isContractLine,
} from '~/utils/rescue-company-settings';

const props = defineProps<{
  clientId: number | undefined;
  clientSellerId?: number | null;
  clientName?: string;
  clientCreditSnapshot?: ClientCreditSnapshot | null;
  serviceType: RescueServiceType;
  fetchServiceDropdown: CatalogDropdownFetcher;
}>();

const quoteLines = defineModel<RescueQuoteLine[]>('quoteLines', {
  required: true,
});
const companySettings = defineModel<RescueCompanySettings | null>(
  'companySettings',
  {
    default: null,
  },
);

const toast = useToast();
const activeEditorTab = ref<QuoteEditorTabValue>('lines');
const clientIdRef = computed(() => props.clientId);
const { settings, pending, error } = useRescueCompanySettings(clientIdRef);

const ivaPercentLabel = computed(() => formatIvaPercent(DEFAULT_IVA_RATE));

const quoteOptional = computed(() =>
  isQuoteOptionalForServiceType(props.serviceType),
);

const hasQuoteLines = computed(() => quoteLines.value.length > 0);

const onlyServicesWithContract = ref(false);
const serviceDropdownFilters = computed(() =>
  onlyServicesWithContract.value ? { has_contract: true } : undefined,
);

const showCreditBadge = computed(
  () =>
    props.clientCreditSnapshot != null &&
    isWizardCreditClient(props.clientCreditSnapshot),
);

const priceMultiplierLabel = computed(() => {
  const multiplier = resolveQuotePriceMultiplier(
    settings.value,
    props.serviceType,
  );
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

const { user: sessionUser } = useUserSession();

const isDev = import.meta.dev;

const previousCalculatedByLineId = ref(new Map<string, number>());

const pricing = computed(() =>
  computeQuotePricing(quoteLines.value, settings.value, {
    clientSellerId: props.clientSellerId,
    serviceType: props.serviceType,
  }),
);

watch(
  () =>
    pricing.value.lines.map((row) => ({
      id: row.line.id,
      calc: row.lineTotalCalculated,
      initializer: row.clientPriceInitializer,
      qty: row.line.quantity,
    })),
  (rows) => {
    const prevMap = previousCalculatedByLineId.value;
    const nextMap = new Map<string, number>();

    for (const row of rows) {
      const line = quoteLines.value.find((entry) => entry.id === row.id);
      if (line == null) continue;

      const prev = prevMap.get(row.id);
      nextMap.set(row.id, row.calc);

      syncQuoteLinePricesFromCalculated(
        line,
        row.calc,
        row.initializer,
        prev,
      );
    }

    previousCalculatedByLineId.value = nextMap;
  },
  { immediate: true, deep: true },
);

function resetLineAppliedPrice(line: RescueQuoteLine) {
  const row = pricing.value.lines.find((entry) => entry.line.id === line.id);
  resetQuoteLinePriceOverrides(
    line,
    row?.lineTotalCalculated ?? 0,
    row?.clientPriceInitializer ?? 0,
  );
}

function onClientPriceChange(line: RescueQuoteLine, value: number) {
  const row = lineRow(line);
  applyClientPriceOverride(
    line,
    value,
    row?.clientPriceInitializer ?? 0,
    sessionUser.value,
  );
}

function onAppliedPriceChange(line: RescueQuoteLine, value: number) {
  const row = lineRow(line);
  applyAppliedPriceOverride(
    line,
    value,
    row?.lineTotalCalculated ?? 0,
    sessionUser.value,
  );
}

function isLinePriceCustom(line: RescueQuoteLine): boolean {
  const row = lineRow(line);
  return (
    line.priceOverrideSource !== 'none'
    || Boolean(row?.isAppliedPriceCustom)
    || Boolean(row?.isClientPriceCustom)
  );
}

function logDevQuotePayload() {
  const quote = buildRescueQuoteCreateBody(
    0,
    quoteLines.value,
    settings.value,
    {
      clientSellerId: props.clientSellerId,
      serviceType: props.serviceType,
    },
  );
  console.log('[dev] rescue quote payload', {
    service_type: props.serviceType,
    client_id: props.clientId,
    client_seller_id: props.clientSellerId,
    quote,
    quote_lines: quoteLines.value,
  });
}

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

function syncLineContract(
  line: RescueQuoteLine,
  overwritePrices = false,
) {
  if (line.service.value == null) {
    clearContractFromLine(line);
    return;
  }

  const item = findContractItemForService(settings.value, line.service.value);
  if (item) {
    applyContractToLine(line, item, { overwritePrices });
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
  [
    () => quoteLines.value.map((line) => line.service.value ?? '').join(','),
    settings,
  ],
  ([serviceKey], previous) => {
    const prevIds = (previous?.[0] ?? '').split(',');
    const nextIds = serviceKey.split(',');
    for (const [index, line] of quoteLines.value.entries()) {
      const serviceChanged =
        previous != null && prevIds[index] !== nextIds[index];
      syncLineContract(line, serviceChanged);
    }
  },
);

watch(
  () => quoteLines.value.map((l) => l.service.value ?? '').join(','),
  async (_idsKey, _prev, onCleanup) => {
    let active = true;
    onCleanup(() => {
      active = false;
    });

    for (const line of quoteLines.value) {
      const id = line.service.value;
      if (id == null) continue;
      if (isContractLine(line)) continue;
      if (line.service.label.trim()) continue;

      try {
        const raw = await $fetch<Record<string, unknown>>(
          `/api/catalogue/service/detail/${id}/`,
        );
        if (!active) return;
        line.service = catalogDropdownSelection(
          id,
          String(raw.name ?? '').trim() || `Servicio #${id}`,
        );
      } catch {
        if (!active) return;
        line.service = catalogDropdownSelection(id, `Servicio #${id}`);
      }
    }
  },
);
</script>

<template>
  <div
    v-if="clientId == null"
    class="rounded-lg border border-default bg-elevated/30 px-4 py-6 text-center text-sm text-muted"
  >
    No hay cliente asociado a esta solicitud.
  </div>

  <OperationalRescueQuoteLoadingState
    v-else-if="pending && settings == null"
    message="Cargando ajustes de cotización…"
  />

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
        {{
          serviceType === 'loan' ? 'Multiplicador préstamo' : 'Multiplicador'
        }}: {{ priceMultiplierLabel }}
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
      <UCheckbox
        v-model="onlyServicesWithContract"
        label="Buscar solo servicios con contrato"
      />

      <div
        v-if="hasQuoteLines"
        class="overflow-x-auto rounded-lg border border-default"
      >
        <table class="w-full min-w-160 text-sm sm:min-w-275">
          <colgroup>
            <col>
            <col class="w-24">
          </colgroup>
          <colgroup>
            <col class="w-36">
            <col class="w-44">
          </colgroup>
          <col class="w-2">
          <colgroup>
            <col class="w-44">
            <col class="w-32">
          </colgroup>
          <col class="w-10">
          <thead>
            <tr class="text-xs">
              <th
                scope="col"
                rowspan="2"
                class="border-b border-default bg-default px-3 py-2 text-left align-bottom font-medium uppercase tracking-wide text-muted"
              >
                {{ QUOTE_LINE_COLUMN_LABELS.service }}
              </th>
              <th
                scope="col"
                rowspan="2"
                class="border-b border-default bg-default px-3 py-2 text-left align-bottom font-medium uppercase tracking-wide text-muted"
              >
                {{ QUOTE_LINE_COLUMN_LABELS.quantity }}
              </th>
              <th
                scope="colgroup"
                colspan="2"
                class="border-t-2 border-b border-info bg-info/10 px-3 py-1.5 text-center text-[11px] font-semibold uppercase tracking-wider text-info"
              >
                {{ QUOTE_LINE_COLUMN_GROUPS.unit }}
              </th>
              <th
                rowspan="2"
                aria-hidden="true"
                class="w-2 border-y border-default bg-accented p-0"
              />
              <th
                scope="colgroup"
                colspan="2"
                class="border-t-2 border-b border-primary bg-primary/10 px-3 py-1.5 text-center text-[11px] font-semibold uppercase tracking-wider text-primary"
              >
                {{ QUOTE_LINE_COLUMN_GROUPS.lineTotal }}
              </th>
              <th
                rowspan="2"
                class="border-b border-default bg-default px-2 py-2"
              />
            </tr>
            <tr class="border-b border-default text-left text-xs uppercase tracking-wide text-muted">
              <th
                scope="col"
                class="bg-info/10 px-3 py-2 font-medium"
              >
                {{ QUOTE_LINE_COLUMN_LABELS.technicalUnitCost }}
              </th>
              <th scope="col" class="bg-info/10 px-3 py-2 font-medium">
                {{ QUOTE_LINE_COLUMN_LABELS.aetoUnit }}
              </th>
              <th
                scope="col"
                class="bg-primary/10 px-3 py-2 font-medium"
              >
                {{ QUOTE_LINE_COLUMN_LABELS.appliedPriceTotal }}
              </th>
              <th
                scope="col"
                class="bg-primary/10 px-3 py-2 text-right font-medium"
              >
                {{ QUOTE_LINE_COLUMN_LABELS.total }}
              </th>
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
                    :name="`quote_lines.${index}.service.value`"
                    class="min-w-48"
                    required
                  >
                    <CatalogDropdownSelect
                      v-model="line.service"
                      placeholder="Buscar servicio"
                      :fetcher="fetchServiceDropdown"
                      :filters="serviceDropdownFilters"
                    />
                  </UFormField>
                  <p
                    v-if="
                      line.service.value == null && line.service.label.trim()
                    "
                    class="text-xs text-muted"
                  >
                    Sugerido: {{ line.service.label }}
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
                  <OperationalRescueQuoteLiveNumberInput
                    v-model="line.quantity"
                    integer
                    :min="0"
                  />
                </UFormField>
              </td>
              <td class="bg-info/5 px-3 py-2 align-top sm:w-36">
                <UFormField :name="`quote_lines.${index}.unit_cost`" required>
                  <OperationalRescueQuoteLiveNumberInput
                    v-model="line.unit_cost"
                    :min="0"
                  />
                </UFormField>
              </td>
              <td class="bg-info/5 px-3 py-2 align-top">
                <span
                  v-if="serviceType === 'loan'"
                  class="font-medium tabular-nums"
                >
                  {{ formatQuoteMoney(lineRow(line)?.clientPrice ?? 0) }}
                </span>
                <div v-else class="space-y-1">
                  <UFormField
                    :name="`quote_lines.${index}.client_price`"
                    class="min-w-0"
                  >
                    <OperationalRescueQuoteLiveNumberInput
                      :model-value="line.client_price"
                      :min="0"
                      @update:model-value="onClientPriceChange(line, $event)"
                    />
                  </UFormField>
                  <p
                    v-if="isLinePriceCustom(line)"
                    class="text-xs text-muted tabular-nums"
                  >
                    Calculado:
                    {{
                      formatQuoteMoney(
                        lineRow(line)?.clientPriceInitializer ?? 0,
                      )
                    }}
                  </p>
                </div>
              </td>
              <td
                aria-hidden="true"
                class="w-2 bg-accented p-0"
              />
              <td class="bg-primary/5 px-3 py-2 align-top">
                <span
                  v-if="serviceType === 'loan'"
                  class="font-medium tabular-nums"
                >
                  {{ formatQuoteMoney(lineRow(line)?.lineTotalCalculated ?? 0) }}
                </span>
                <div v-else class="space-y-1">
                  <div class="flex items-center gap-1">
                    <UFormField
                      :name="`quote_lines.${index}.applied_price`"
                      class="min-w-0 flex-1"
                    >
                      <OperationalRescueQuoteLiveNumberInput
                        :model-value="line.applied_price"
                        :min="0"
                        @update:model-value="onAppliedPriceChange(line, $event)"
                      />
                    </UFormField>
                    <UButton
                      type="button"
                      color="neutral"
                      variant="ghost"
                      icon="i-lucide-rotate-ccw"
                      size="xs"
                      :disabled="!isLinePriceCustom(line)"
                      aria-label="Restablecer precios de la fila"
                      @click="resetLineAppliedPrice(line)"
                    />
                  </div>
                  <p
                    v-if="isLinePriceCustom(line)"
                    class="text-xs text-muted tabular-nums"
                  >
                    Calculado:
                    {{ formatQuoteMoney(lineRow(line)!.lineTotalCalculated) }}
                  </p>
                </div>
              </td>
              <td class="bg-primary/5 px-3 py-2 align-top text-right">
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
        Agregar servicio
      </button>

      <UButton
        v-if="isDev"
        type="button"
        color="neutral"
        variant="outline"
        icon="i-lucide-bug"
        :label="QUOTE_DEV_UNLOCK_COPY.simulatePayloadLabel"
        @click="logDevQuotePayload"
      />

      <div
        v-if="hasQuoteLines"
        class="ml-auto w-full max-w-xs space-y-3 text-sm"
      >
        <div class="space-y-2">
          <div class="flex justify-between gap-4">
            <span class="text-muted">{{ QUOTE_SUMMARY_LABELS.subtotal }}</span>
            <span class="tabular-nums">
              {{ formatQuoteMoney(pricing.subtotalLines) }}
            </span>
          </div>
          <div class="flex justify-between gap-4">
            <span class="text-muted">IVA ({{ ivaPercentLabel }})</span>
            <span class="tabular-nums">
              +{{ formatQuoteMoney(pricing.ivaAmount) }}
            </span>
          </div>
          <div
            class="flex justify-between gap-4 border-t border-default pt-2"
          >
            <span class="font-semibold">TOTAL</span>
            <span class="text-lg font-bold tabular-nums text-primary">
              {{ formatQuoteMoney(pricing.totalCharged) }}
            </span>
          </div>
        </div>

        <div
          class="space-y-1.5 rounded-lg bg-elevated px-3 py-2.5 ring-1 ring-default/60"
        >
          <p
            class="text-[11px] font-medium uppercase tracking-wider text-muted"
          >
            {{ QUOTE_SUMMARY_LABELS.internalReference }}
          </p>
          <div class="flex justify-between gap-4 text-muted">
            <span>{{ QUOTE_SUMMARY_LABELS.technicalCost }}</span>
            <span class="tabular-nums">
              {{ formatQuoteMoney(pricing.costSubtotal) }}
            </span>
          </div>
          <div class="flex justify-between gap-4">
            <span class="font-medium text-highlighted">
              {{ QUOTE_SUMMARY_LABELS.utility }}
            </span>
            <span class="font-semibold tabular-nums text-highlighted">
              {{ formatQuoteMoney(pricing.profit) }}
            </span>
          </div>
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
