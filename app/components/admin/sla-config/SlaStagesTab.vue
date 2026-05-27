<script setup lang="ts">
import { SLA_REQUEST_TYPE_META, SLA_SERVICE_TYPES } from '~/constants/sla-config';
import type { RescueServiceType } from '~/interfaces/rescue';
import type { SlaStageConfigRow } from '~/interfaces/sla';
import { isOptionalSlaStage } from '~/utils/sla-duration';

const sla = useSlaConfigurationInject();

const openByType = ref<Record<RescueServiceType, boolean>>({
  rescue: true,
  loan: false,
  direct_budget: false,
  proyect: false,
});

function flowSteps(serviceType: RescueServiceType) {
  return buildSlaFlowSteps(sla.stagesForType(serviceType, false));
}

function onStageFieldChange(row: SlaStageConfigRow) {
  sla.markStageDirty(row);
}

function portalRowForType(serviceType: RescueServiceType) {
  return sla.stages.value.find(
    (row) =>
      row.service_type === serviceType &&
      row.from_status === 'requested',
  );
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
      :count-label="`${sla.stagesForType(serviceType, false).length} etapa(s)`"
      :has-dirty="sla.hasDirtyStagesForType(serviceType, false)"
    >
      <AdminSlaConfigSlaFlowDiagram :steps="flowSteps(serviceType)" />

      <div class="hidden text-xs font-medium text-muted sm:grid sm:grid-cols-12 sm:gap-3 sm:px-1">
        <span class="col-span-3">Etapa</span>
        <span class="col-span-4">Transición</span>
        <span class="col-span-3">Tiempo límite</span>
        <span class="col-span-2">Acciones</span>
      </div>

      <div
        v-for="(row, index) in sla.stagesForType(serviceType, false)"
        :key="row.id ?? `new-${serviceType}-${index}`"
        class="grid grid-cols-1 gap-3 rounded-lg border border-default p-3 sm:grid-cols-12 sm:items-start sm:gap-3"
      >
        <div class="sm:col-span-3">
          <UInput
            v-model="row.stage_name"
            class="w-full"
            placeholder="Nombre de etapa"
            @update:model-value="onStageFieldChange(row)"
          />
          <UBadge
            v-if="isOptionalSlaStage(row.from_status, row.to_status)"
            class="mt-1"
            color="neutral"
            variant="subtle"
            size="xs"
            label="opcional"
          />
        </div>

        <div class="flex flex-col gap-2 sm:col-span-4 sm:flex-row sm:items-start">
          <AdminSlaConfigSlaOperationalStatusSelect
            v-model="row.from_status"
            @update:model-value="onStageFieldChange(row)"
          />
          <span class="hidden shrink-0 self-center text-muted sm:inline">→</span>
          <AdminSlaConfigSlaOperationalStatusSelect
            v-model="row.to_status"
            @update:model-value="onStageFieldChange(row)"
          />
        </div>

        <div class="sm:col-span-3">
          <AdminSlaConfigSlaDurationInput
            :minutes="row.limit_minutes"
            @update:minutes="
              (v) => {
                row.limit_minutes = v;
                onStageFieldChange(row);
              }
            "
          />
        </div>

        <div class="flex items-center justify-between gap-2 sm:col-span-2 sm:justify-end">
          <UCheckbox
            v-model="row.is_active"
            label="Activo"
            @update:model-value="onStageFieldChange(row)"
          />
          <UButton
            icon="i-lucide-trash-2"
            color="error"
            variant="ghost"
            size="sm"
            aria-label="Eliminar etapa"
            @click="sla.removeStage(row)"
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
          @click="sla.addStage(serviceType, false)"
        />
        <UButton
          icon="i-lucide-save"
          :label="`Guardar cambios de ${SLA_REQUEST_TYPE_META[serviceType].label}`"
          size="sm"
          :loading="sla.isSaving(`stages-${serviceType}`)"
          :disabled="!sla.hasDirtyStagesForType(serviceType, false)"
          @click="sla.saveStagesForType(serviceType)"
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
        <template v-if="portalRowForType(serviceType)">
          <div class="min-w-0 flex-1">
            <p class="font-medium">
              {{ SLA_REQUEST_TYPE_META[serviceType].label }}
            </p>
            <p class="text-sm text-muted">
              Desde Solicitado → Activo sin cotizar
            </p>
          </div>
          <div class="flex flex-wrap items-end gap-3">
            <div class="w-40">
              <AdminSlaConfigSlaDurationInput
                :minutes="portalRowForType(serviceType)!.limit_minutes"
                minutes-only
                @update:minutes="
                  (v) => {
                    portalRowForType(serviceType)!.limit_minutes = v;
                    sla.markStageDirty(portalRowForType(serviceType)!);
                  }
                "
              />
            </div>
            <UButton
              icon="i-lucide-save"
              label="Guardar"
              size="sm"
              :loading="sla.isSaving(`portal-${serviceType}`)"
              :disabled="!sla.hasDirtyStagesForType(serviceType, true)"
              @click="sla.savePortalStage(portalRowForType(serviceType)!)"
            />
          </div>
        </template>
      </div>
    </section>
  </div>
</template>
