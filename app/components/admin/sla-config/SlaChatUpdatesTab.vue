<script setup lang="ts">
import { SLA_REQUEST_TYPE_META, SLA_SERVICE_TYPES } from '~/constants/sla-config';
import type { RescueServiceType } from '~/interfaces/rescue';
import type { SlaUpdateChatConfigRow } from '~/interfaces/sla';

const sla = useSlaConfigurationInject();

const openByType = ref<Record<RescueServiceType, boolean>>({
  rescue: true,
  loan: false,
  direct_budget: false,
  proyect: false,
});

function onChatChange(row: SlaUpdateChatConfigRow) {
  sla.markUpdateChatDirty(row);
}

function setOpen(serviceType: RescueServiceType, value: boolean) {
  openByType.value[serviceType] = value;
}

function disabledStatusesForRow(
  serviceType: RescueServiceType,
  row: SlaUpdateChatConfigRow,
) {
  return sla.usedStatusesForType(serviceType, 'updateChat', row);
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <UAlert
      color="info"
      variant="subtle"
      icon="i-lucide-info"
      title="Actualizaciones de chat"
      description="Define cuánto tiempo puede pasar sin que el gestor escriba en el chat antes de generar alertas amarilla y roja, por estatus y tipo de solicitud."
    />

    <AdminSlaConfigSlaRequestTypeCollapsible
      v-for="serviceType in SLA_SERVICE_TYPES"
      :key="serviceType"
      :open="openByType[serviceType]"
      :service-type="serviceType"
      :count-label="`${sla.updateChatForType(serviceType).length} estatus configurados`"
      :has-dirty="sla.hasDirtyUpdateChatForType(serviceType)"
      @update:open="(v) => setOpen(serviceType, v)"
    >
      <div class="hidden text-xs font-medium text-muted sm:grid sm:grid-cols-12 sm:gap-3">
        <span class="col-span-4">Estatus operativo</span>
        <span class="col-span-4">Amarillo</span>
        <span class="col-span-4">Rojo</span>
      </div>

      <div
        v-for="(row, index) in sla.updateChatForType(serviceType)"
        :key="row.id ?? `chat-${serviceType}-${index}`"
        class="grid grid-cols-1 gap-3 rounded-lg border border-default p-3 sm:grid-cols-12 sm:items-start"
      >
        <div class="sm:col-span-4">
          <AdminSlaConfigSlaOperationalStatusSelect
            v-model="row.operative_status"
            :disabled-statuses="disabledStatusesForRow(serviceType, row)"
            @update:model-value="onChatChange(row)"
          />
        </div>
        <div class="sm:col-span-4">
          <AdminSlaConfigSlaDurationInput
            v-model:time="row.yellow_time"
            v-model:unit="row.yellow_unit"
            variant="amber"
            @update:time="onChatChange(row)"
            @update:unit="onChatChange(row)"
          />
        </div>
        <div class="sm:col-span-4">
          <AdminSlaConfigSlaDurationInput
            v-model:time="row.red_time"
            v-model:unit="row.red_unit"
            variant="red"
            @update:time="onChatChange(row)"
            @update:unit="onChatChange(row)"
          />
        </div>
      </div>

      <div class="flex flex-wrap gap-2">
        <UButton
          icon="i-lucide-plus"
          label="Agregar estatus"
          color="neutral"
          variant="outline"
          size="sm"
          :disabled="!sla.canAddUpdateChat(serviceType)"
          @click="sla.addUpdateChat(serviceType)"
        />
        <UButton
          icon="i-lucide-save"
          :label="`Guardar cambios de ${SLA_REQUEST_TYPE_META[serviceType].label}`"
          size="sm"
          :loading="sla.isSaving(`chat-${serviceType}`)"
          :disabled="!sla.hasDirtyUpdateChatForType(serviceType)"
          @click="sla.saveUpdateChatForType(serviceType)"
        />
      </div>
    </AdminSlaConfigSlaRequestTypeCollapsible>
  </div>
</template>
