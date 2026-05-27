<script setup lang="ts">
import { SLA_REQUEST_TYPE_META, SLA_SERVICE_TYPES } from '~/constants/sla-config';
import type { RescueServiceType } from '~/interfaces/rescue';
import type { SlaChatIdleAlertConfigRow } from '~/interfaces/sla';

const sla = useSlaConfigurationInject();

const openByType = ref<Record<RescueServiceType, boolean>>({
  rescue: true,
  loan: false,
  direct_budget: false,
  proyect: false,
});

function onChatChange(row: SlaChatIdleAlertConfigRow) {
  sla.markChatDirty(row);
}

function setOpen(serviceType: RescueServiceType, value: boolean) {
  openByType.value[serviceType] = value;
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
      :count-label="`${sla.chatForType(serviceType).length} estatus configurados`"
      :has-dirty="sla.hasDirtyChatForType(serviceType)"
      @update:open="(v) => setOpen(serviceType, v)"
    >
      <div class="hidden text-xs font-medium text-muted sm:grid sm:grid-cols-12 sm:gap-3">
        <span class="col-span-4">Estatus operativo</span>
        <span class="col-span-3">Amarillo</span>
        <span class="col-span-3">Rojo</span>
        <span class="col-span-2">Acciones</span>
      </div>

      <div
        v-for="(row, index) in sla.chatForType(serviceType)"
        :key="row.id ?? `chat-${serviceType}-${index}`"
        class="grid grid-cols-1 gap-3 rounded-lg border border-default p-3 sm:grid-cols-12 sm:items-start"
      >
        <div class="sm:col-span-4">
          <AdminSlaConfigSlaOperationalStatusSelect
            v-model="row.operative_status"
            @update:model-value="onChatChange(row)"
          />
        </div>
        <div class="sm:col-span-3">
          <AdminSlaConfigSlaDurationInput
            variant="amber"
            :minutes="row.yellow_limit_minutes"
            @update:minutes="
              (v) => {
                row.yellow_limit_minutes = v;
                onChatChange(row);
              }
            "
          />
        </div>
        <div class="sm:col-span-3">
          <AdminSlaConfigSlaDurationInput
            variant="red"
            :minutes="row.red_limit_minutes"
            @update:minutes="
              (v) => {
                row.red_limit_minutes = v;
                onChatChange(row);
              }
            "
          />
        </div>
        <div class="flex items-center justify-between gap-2 sm:col-span-2 sm:justify-end">
          <UCheckbox
            v-model="row.is_active"
            label="Activo"
            @update:model-value="onChatChange(row)"
          />
          <UButton
            icon="i-lucide-trash-2"
            color="error"
            variant="ghost"
            size="sm"
            aria-label="Eliminar"
            @click="sla.removeChatAlert(row)"
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
          @click="sla.addChatAlert(serviceType)"
        />
        <UButton
          icon="i-lucide-save"
          :label="`Guardar cambios de ${SLA_REQUEST_TYPE_META[serviceType].label}`"
          size="sm"
          :loading="sla.isSaving(`chat-${serviceType}`)"
          :disabled="!sla.hasDirtyChatForType(serviceType)"
          @click="sla.saveChatForType(serviceType)"
        />
      </div>
    </AdminSlaConfigSlaRequestTypeCollapsible>
  </div>
</template>
