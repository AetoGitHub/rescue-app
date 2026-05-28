<script setup lang="ts">
import {
  SLA_PORTAL_FROM_STATUS,
  SLA_REQUEST_TYPE_META,
  SLA_SERVICE_TYPES,
} from '~/constants/sla-config';
import type { RescueServiceType } from '~/interfaces/rescue';
import type { SlaTimePerStageRow } from '~/interfaces/sla';

const sla = useSlaConfigurationInject();

const openByType = ref<Record<RescueServiceType, boolean>>({
  rescue: true,
  loan: false,
  direct_budget: false,
  proyect: false,
});

function timelineItems(serviceType: RescueServiceType) {
  return buildSlaStatusTimeline(
    sla.timePerStageForType(serviceType, false),
    serviceType,
  );
}

function onRowChange(row: SlaTimePerStageRow) {
  sla.markTimePerStageDirty(row);
}

function portalRowForType(serviceType: RescueServiceType) {
  return sla.timePerStageForType(serviceType, true)[0] ?? null;
}

function disabledStatusesForRow(
  serviceType: RescueServiceType,
  row: SlaTimePerStageRow,
) {
  return sla.usedStatusesForType(serviceType, 'timePerStage', row);
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <AdminSlaConfigSlaRequestTypeCollapsible
      v-for="serviceType in SLA_SERVICE_TYPES"
      :key="serviceType"
      :open="openByType[serviceType]"
      :service-type="serviceType"
      @update:open="(v) => (openByType[serviceType] = v)"
      :count-label="`${sla.timePerStageForType(serviceType, false).length} etapa(s)`"
      :has-dirty="sla.hasDirtyTimePerStageForType(serviceType, false)"
    >
      <AdminSlaConfigSlaFlowDiagram :items="timelineItems(serviceType)" />

      <div class="hidden text-xs font-medium text-muted sm:grid sm:grid-cols-12 sm:gap-3 sm:px-1">
        <span class="col-span-5">Estatus operativo</span>
        <span class="col-span-7">Tiempo límite</span>
      </div>

      <div
        v-for="(row, index) in sla.timePerStageForType(serviceType, false)"
        :key="row.id ?? `new-${serviceType}-${index}`"
        class="grid grid-cols-1 gap-3 rounded-lg border border-default p-3 sm:grid-cols-12 sm:items-start sm:gap-3"
      >
        <div class="sm:col-span-5">
          <AdminSlaConfigSlaOperationalStatusSelect
            v-model="row.operative_status"
            :exclude-statuses="[SLA_PORTAL_FROM_STATUS]"
            :disabled-statuses="disabledStatusesForRow(serviceType, row)"
            @update:model-value="onRowChange(row)"
          />
          <UBadge
            v-if="row.operative_status === 'waiting_advance_payment'"
            class="mt-1"
            color="neutral"
            variant="subtle"
            size="xs"
            label="opcional"
          />
        </div>

        <div class="sm:col-span-7">
          <AdminSlaConfigSlaDurationInput
            v-model:time="row.time"
            v-model:unit="row.unit"
            @update:time="onRowChange(row)"
            @update:unit="onRowChange(row)"
          />
        </div>
      </div>

      <p
        v-if="SLA_REQUEST_TYPE_META[serviceType].note"
        class="text-sm text-muted"
      >
        {{ SLA_REQUEST_TYPE_META[serviceType].note }}
      </p>

      <div class="flex flex-wrap gap-2">
        <UButton
          icon="i-lucide-plus"
          label="Agregar etapa"
          color="neutral"
          variant="outline"
          size="sm"
          :disabled="!sla.canAddTimePerStage(serviceType, false)"
          @click="sla.addTimePerStage(serviceType, false)"
        />
        <UButton
          icon="i-lucide-save"
          :label="`Guardar cambios de ${SLA_REQUEST_TYPE_META[serviceType].label}`"
          size="sm"
          :loading="sla.isSaving(`stages-${serviceType}`)"
          :disabled="!sla.hasDirtyTimePerStageForType(serviceType, false)"
          @click="sla.saveTimePerStageForType(serviceType)"
        />
      </div>
    </AdminSlaConfigSlaRequestTypeCollapsible>

    <USeparator />

    <section class="flex flex-col gap-4">
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-globe" class="size-5 text-primary" />
        <h2 class="text-lg font-semibold">
          Solicitudes desde Portal (sin gestor)
        </h2>
      </div>
      <p class="text-sm text-muted">
        Tiempo que tiene un gestor para tomar una solicitud que entró por el portal de cliente.
      </p>

      <div
        v-for="serviceType in SLA_SERVICE_TYPES"
        :key="`portal-${serviceType}`"
        class="flex flex-col gap-3 rounded-lg border border-default p-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div class="min-w-0 flex-1">
          <p class="font-medium">
            {{ SLA_REQUEST_TYPE_META[serviceType].label }}
          </p>
          <p class="text-sm text-muted">
            Tiempo en estatus Solicitado
          </p>
        </div>

        <template v-if="portalRowForType(serviceType)">
          <div class="flex flex-wrap items-end gap-3">
            <div class="w-48">
              <AdminSlaConfigSlaDurationInput
                v-model:time="portalRowForType(serviceType)!.time"
                v-model:unit="portalRowForType(serviceType)!.unit"
                minutes-only
                @update:time="sla.markTimePerStageDirty(portalRowForType(serviceType)!)"
                @update:unit="sla.markTimePerStageDirty(portalRowForType(serviceType)!)"
              />
            </div>
            <UButton
              icon="i-lucide-save"
              label="Guardar"
              size="sm"
              :loading="sla.isSaving(`portal-${serviceType}`)"
              :disabled="!portalRowForType(serviceType)!._dirty"
              @click="sla.savePortalTimePerStage(portalRowForType(serviceType)!)"
            />
          </div>
        </template>
        <UButton
          v-else
          icon="i-lucide-plus"
          label="Configurar portal"
          color="neutral"
          variant="outline"
          size="sm"
          :disabled="!sla.canAddTimePerStage(serviceType, true)"
          @click="sla.addTimePerStage(serviceType, true)"
        />
      </div>
    </section>
  </div>
</template>
