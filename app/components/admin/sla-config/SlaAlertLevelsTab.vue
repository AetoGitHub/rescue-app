<script setup lang="ts">
import { SLA_ALERT_NOTIFY_OPTIONS } from '~/constants/sla-config';
import type { SlaAlertLevelConfigRow } from '~/interfaces/sla';

const sla = useSlaConfigurationInject();

const levelRows = computed(() => sla.alertLevels.value);
const alertLevelsDirty = computed(() => sla.hasDirtyAlertLevels.value);

function onLevelChange(row: SlaAlertLevelConfigRow) {
  sla.markAlertDirty(row);
}

function notifyValue(
  row: SlaAlertLevelConfigRow,
  key: (typeof SLA_ALERT_NOTIFY_OPTIONS)[number]['key'],
) {
  return row[key];
}

function setNotify(
  row: SlaAlertLevelConfigRow,
  key: (typeof SLA_ALERT_NOTIFY_OPTIONS)[number]['key'],
  value: boolean,
) {
  row[key] = value;
  onLevelChange(row);
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <p class="text-sm text-muted">
      Umbrales porcentuales que disparan alertas en todas las etapas SLA.
    </p>

    <article
      v-for="(row, index) in levelRows"
      :key="row.id ?? `alert-new-${index}`"
      class="flex flex-col gap-4 rounded-lg border border-default bg-default p-4 pl-3"
      :style="{ borderLeftWidth: '4px', borderLeftColor: row.color }"
    >
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-center">
        <div class="flex flex-wrap items-center gap-3 sm:col-span-8">
          <input
            v-model="row.color"
            type="color"
            class="size-10 shrink-0 cursor-pointer rounded border border-default bg-transparent p-0.5"
            aria-label="Color del nivel"
            @input="onLevelChange(row)"
          >
          <UInput
            v-model="row.name"
            class="min-w-48 flex-1"
            placeholder="Nombre del nivel"
            @update:model-value="onLevelChange(row)"
          />
          <UCheckbox
            v-model="row.is_active"
            label="Activo"
            @update:model-value="onLevelChange(row)"
          />
        </div>
        <div class="flex justify-end sm:col-span-4">
          <UButton
            icon="i-lucide-trash-2"
            color="error"
            variant="ghost"
            size="sm"
            aria-label="Eliminar nivel"
            @click="sla.removeAlertLevel(row)"
          />
        </div>
      </div>

      <div class="flex flex-col gap-1">
        <div class="flex flex-wrap items-center gap-2 text-sm">
          <span>Alertar cuando se consuma el</span>
          <UInputNumber
            v-model="row.threshold_percent"
            v-bind="catalogIntegerInputProps"
            class="w-24"
            @update:model-value="onLevelChange(row)"
          />
          <span>% del tiempo límite</span>
        </div>
        <p
          class="text-sm font-medium"
          :class="getSlaAlertThresholdHelper(row.threshold_percent).colorClass"
        >
          {{ getSlaAlertThresholdHelper(row.threshold_percent).text }}
        </p>
      </div>

      <div class="flex flex-col gap-2">
        <span class="text-sm font-medium">Notificar a:</span>
        <div class="flex flex-wrap gap-4">
          <UCheckbox
            v-for="option in SLA_ALERT_NOTIFY_OPTIONS"
            :key="option.key"
            :model-value="notifyValue(row, option.key)"
            :label="option.label"
            @update:model-value="
              (v) => setNotify(row, option.key, Boolean(v))
            "
          />
        </div>
      </div>

      <div class="flex items-center gap-2">
        <span class="text-xs text-muted">Vista previa:</span>
        <span
          class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-white"
          :style="{ backgroundColor: row.color }"
        >
          <span class="size-1.5 rounded-full bg-white/90" />
          {{ row.name }} ({{ row.threshold_percent }}%)
        </span>
      </div>
    </article>

    <div class="flex flex-wrap gap-2 pt-2">
      <UButton
        icon="i-lucide-plus"
        label="Agregar nivel"
        color="neutral"
        variant="outline"
        size="sm"
        @click="sla.addAlertLevel()"
      />
      <UButton
        icon="i-lucide-save"
        label="Guardar todos los niveles"
        size="sm"
        :loading="sla.isSaving('alert-levels')"
        :disabled="!alertLevelsDirty"
        @click="sla.saveAlertLevels()"
      />
    </div>
  </div>
</template>
