<script setup lang="ts">
import type { CatalogDropdownFetcher } from '~/composables/useCatalogDropdown';
import type { RescueQuoteLine } from '~/interfaces/rescue';
import type { RescueRequestFormState } from '~/schemas/rescue-create';
import { DEFAULT_IVA_RATE } from '~/constants/quote-pricing';
import {
  applyContractToLine,
  clearContractFromLine,
  findContractItemForService,
  isContractLine,
} from '~/utils/rescue-company-settings';

const state = defineModel<RescueRequestFormState>({ required: true });

defineProps<{
  fetchServiceDropdown: CatalogDropdownFetcher;
}>();

const toast = useToast();
const clientId = computed(() => state.value.client);
const { settings, pending, error } = useRescueCompanySettings(clientId);

const ivaPercentLabel = computed(() => formatIvaPercent(DEFAULT_IVA_RATE));

const quoteOptional = computed(() =>
  isQuoteOptionalForServiceType(state.value.service_type),
);

const hasQuoteLines = computed(() => state.value.quote_lines.length > 0);

watch(
  settings,
  (value) => {
    state.value.company_settings = value;
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
  () => state.value.client,
  (newId, oldId) => {
    if (oldId != null && newId !== oldId) {
      for (const line of state.value.quote_lines) {
        clearContractFromLine(line);
      }
    }
  },
);

const pricing = computed(() =>
  computeQuotePricing(state.value.quote_lines, settings.value),
);

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
  state.value.quote_lines.push(createEmptyQuoteLine());
}

function removeLine(id: string) {
  if (!quoteOptional.value && state.value.quote_lines.length <= 1) return;
  state.value.quote_lines = state.value.quote_lines.filter((row) => row.id !== id);
}

function canRemoveLine(): boolean {
  return quoteOptional.value || state.value.quote_lines.length > 1;
}

watch(
  () => state.value.quote_lines.map((line) => line.service_id),
  () => {
    for (const line of state.value.quote_lines) {
      syncLineContract(line);
    }
  },
  { deep: true },
);

watch(
  () => state.value.quote_lines.map((l) => l.service_id),
  async (ids, _prev, onCleanup) => {
    let active = true;
    onCleanup(() => {
      active = false;
    });

    for (const [i, line] of state.value.quote_lines.entries()) {
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
    v-if="pending && settings == null"
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
      se calcula sobre la ganancia. Las líneas con convenio usan precio fijo. IVA
      provisional {{ ivaPercentLabel }} sobre el total antes de impuestos.
    </p>

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
            v-for="(line, index) in state.quote_lines"
            :key="line.id"
            class="border-b border-default last:border-b-0"
          >
            <td class="px-3 py-2 align-top">
              <div class="space-y-2">
                <UFormField
                  :name="`quote_lines.${index}.service_id`"
                  class="min-w-48"
                >
                  <CatalogDropdownSelect
                    v-model="line.service_id"
                    placeholder="Buscar servicio"
                    :fetcher="fetchServiceDropdown"
                  />
                </UFormField>
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
              <UFormField :name="`quote_lines.${index}.quantity`">
                <UInputNumber
                  v-model="line.quantity"
                  v-bind="catalogIntegerInputProps"
                  :min="1"
                />
              </UFormField>
            </td>
            <td class="px-3 py-2 align-top">
              <UFormField :name="`quote_lines.${index}.unit_cost`">
                <UInputNumber
                  v-model="line.unit_cost"
                  v-bind="catalogCurrencyInputProps"
                  :min="0"
                  :disabled="isContractLine(line)"
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
        <span class="text-muted">Subtotal costo (empresa)</span>
        <span class="font-medium tabular-nums">
          {{ formatQuoteMoney(pricing.costSubtotal) }}
        </span>
      </div>
      <div class="flex justify-between gap-4">
        <span class="text-muted">Subtotal cliente (líneas)</span>
        <span class="tabular-nums">
          {{ formatQuoteMoney(pricing.subtotalLines) }}
        </span>
      </div>
      <div class="flex justify-between gap-4">
        <span class="text-muted">Ganancia</span>
        <span class="tabular-nums">
          {{ formatQuoteMoney(pricing.profit) }}
        </span>
      </div>
      <div
        v-if="pricing.commissionValueAdd > 0.001"
        class="flex justify-between gap-4"
      >
        <span class="text-muted">Comisión sobre ganancia</span>
        <span class="tabular-nums text-muted">
          +{{ formatQuoteMoney(pricing.commissionValueAdd) }}
        </span>
      </div>
      <div class="flex justify-between gap-4">
        <span class="text-muted">Subtotal antes de IVA</span>
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
        <span class="font-medium">Total cotizado</span>
        <span class="text-base font-semibold tabular-nums text-primary">
          {{ formatQuoteMoney(pricing.totalCharged) }}
        </span>
      </div>
    </UCard>
  </div>
</template>
