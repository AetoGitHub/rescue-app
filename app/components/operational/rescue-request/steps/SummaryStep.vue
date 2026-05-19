<script setup lang="ts">
import type { RescueRequestFormState } from '~/schemas/rescue-create';
import { RESCUE_SERVICE_TYPE_OPTIONS } from '~/constants/rescue-select-options';
import { parseRescueCoord } from '~/schemas/rescue-create';

const state = defineModel<RescueRequestFormState>({ required: true });

const quoteSummary = computed(() =>
  computeQuoteSummary(state.value.quote_lines),
);

const serviceTypeOption = computed(() =>
  RESCUE_SERVICE_TYPE_OPTIONS.find((o) => o.value === state.value.service_type),
);

const locationCoordsLabel = computed(() => {
  const lat = parseRescueCoord(state.value.location_latitude);
  const lng = parseRescueCoord(state.value.location_longitude);
  if (lat == null || lng == null) return '—';
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
});
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
            {{ state.clientLabel || (state.client ? `Cliente #${state.client}` : '—') }}
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
        <div v-if="state.manager">
          <dt class="text-muted">Gestor</dt>
          <dd class="font-medium">
            {{ state.managerLabel || `Usuario #${state.manager}` }}
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
        <div
          v-if="state.service_type === 'rescue'"
          class="sm:col-span-2"
        >
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
      v-if="quoteSummary.lines.length > 0"
      variant="subtle"
      :ui="{ body: 'space-y-3 text-sm' }"
    >
      <h3 class="text-xs font-semibold uppercase tracking-wider text-primary">
        Cotización
      </h3>
      <ul class="divide-y divide-default">
        <li
          v-for="row in quoteSummary.lines"
          :key="row.line.id"
          class="flex flex-wrap items-baseline justify-between gap-2 py-2 first:pt-0 last:pb-0"
        >
          <span class="font-medium">
            {{ row.line.service_label || `Servicio #${row.line.service_id}` }}
            <span class="font-normal text-muted">
              × {{ row.line.quantity }}
            </span>
          </span>
          <span class="tabular-nums">
            {{ formatQuoteMoney(row.lineTotal) }}
          </span>
        </li>
      </ul>
      <div class="flex justify-between gap-4 border-t border-default pt-2 font-medium">
        <span>Total cotizado</span>
        <span class="tabular-nums text-primary">
          {{ formatQuoteMoney(quoteSummary.totalCharged) }}
        </span>
      </div>
    </UCard>

    <UFormField label="Nota interna" name="internal_notes">
      <UTextarea v-model="state.internal_notes" class="w-full" :rows="4" />
    </UFormField>
  </div>
</template>
