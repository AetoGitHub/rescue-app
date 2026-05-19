<script setup lang="ts">
import type { CatalogDropdownFetcher } from '~/composables/useCatalogDropdown';
import type { RescueRequestFormState } from '~/schemas/rescue-create';
import { DEFAULT_QUOTE_MARGIN_RATE } from '~/constants/quote-pricing';

const state = defineModel<RescueRequestFormState>({ required: true });

defineProps<{
  fetchServiceDropdown: CatalogDropdownFetcher;
}>();

const marginPercentLabel = computed(
  () => `${Math.round(DEFAULT_QUOTE_MARGIN_RATE * 100)}%`,
);

const summary = computed(() => computeQuoteSummary(state.value.quote_lines));

function addLine() {
  state.value.quote_lines.push(createEmptyQuoteLine());
}

function removeLine(id: string) {
  if (state.value.quote_lines.length <= 1) return;
  state.value.quote_lines = state.value.quote_lines.filter((row) => row.id !== id);
}

function lineTotals(line: (typeof state.value.quote_lines)[number]) {
  return computeQuoteLineTotals(line);
}

watch(
  () => state.value.quote_lines.map((l) => l.service_id),
  async (ids, _prev, onCleanup) => {
    let active = true;
    onCleanup(() => {
      active = false;
    });

    for (let i = 0; i < state.value.quote_lines.length; i++) {
      const line = state.value.quote_lines[i];
      const id = ids[i];
      if (id == null) {
        if (active) line.service_label = '';
        continue;
      }
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
  <div class="space-y-4">
    <p class="text-sm text-muted">
      Agrega los servicios de la cotización. El total por línea incluye un margen
      de {{ marginPercentLabel }} y se redondea al diez superior (ej. 272 → 280).
    </p>

    <div class="overflow-x-auto rounded-lg border border-default">
      <table class="w-full min-w-[640px] text-sm">
        <thead>
          <tr class="border-b border-default bg-elevated/50 text-left text-xs text-muted">
            <th class="px-3 py-2 font-medium">Servicio</th>
            <th class="w-24 px-3 py-2 font-medium">Cantidad</th>
            <th class="w-36 px-3 py-2 font-medium">Pago unitario</th>
            <th class="w-32 px-3 py-2 font-medium text-right">Total línea</th>
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
              <UFormField
                :name="`quote_lines.${index}.service_id`"
                class="min-w-[12rem]"
              >
                <CatalogDropdownSelect
                  v-model="line.service_id"
                  placeholder="Buscar servicio"
                  :fetcher="fetchServiceDropdown"
                />
              </UFormField>
            </td>
            <td class="px-3 py-2 align-top">
              <UFormField :name="`quote_lines.${index}.quantity`">
                <UInput
                  v-model.number="line.quantity"
                  type="number"
                  min="0"
                  step="1"
                  class="w-full"
                />
              </UFormField>
            </td>
            <td class="px-3 py-2 align-top">
              <UFormField :name="`quote_lines.${index}.unit_cost`">
                <UInput
                  v-model.number="line.unit_cost"
                  type="number"
                  min="0"
                  step="0.01"
                  class="w-full"
                />
              </UFormField>
            </td>
            <td class="px-3 py-2 align-top text-right">
              <span class="font-medium tabular-nums">
                {{ formatQuoteMoney(lineTotals(line).lineTotal) }}
              </span>
              <span
                v-if="lineTotals(line).roundingAdjustment > 0.001"
                class="mt-0.5 block text-xs text-muted"
              >
                +{{ formatQuoteMoney(lineTotals(line).roundingAdjustment) }}
                redondeo
              </span>
            </td>
            <td class="px-2 py-2 align-top">
              <UButton
                type="button"
                color="neutral"
                variant="ghost"
                icon="i-lucide-trash-2"
                size="xs"
                :disabled="state.quote_lines.length <= 1"
                aria-label="Eliminar fila"
                @click="removeLine(line.id)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <UButton
      type="button"
      color="neutral"
      variant="outline"
      icon="i-lucide-plus"
      label="Agregar servicio"
      @click="addLine"
    />

    <UCard variant="subtle" :ui="{ body: 'space-y-2 text-sm' }">
      <div class="flex justify-between gap-4">
        <span class="text-muted">Subtotal costo (empresa)</span>
        <span class="font-medium tabular-nums">
          {{ formatQuoteMoney(summary.costSubtotal) }}
        </span>
      </div>
      <div
        v-if="summary.roundingAdjustment > 0.001"
        class="flex justify-between gap-4"
      >
        <span class="text-muted">Ajuste por redondeo</span>
        <span class="tabular-nums text-muted">
          +{{ formatQuoteMoney(summary.roundingAdjustment) }}
        </span>
      </div>
      <div class="flex justify-between gap-4 border-t border-default pt-2">
        <span class="font-medium">Total cotizado</span>
        <span class="text-base font-semibold tabular-nums text-primary">
          {{ formatQuoteMoney(summary.totalCharged) }}
        </span>
      </div>
    </UCard>
  </div>
</template>
