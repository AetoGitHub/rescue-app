<script setup lang="ts">
import type { SlaConfigTabValue } from '~/constants/sla-config';
import { SLA_TAB_ITEMS } from '~/constants/sla-config';
import { slaConfigurationKey } from '~/composables/useSlaConfiguration';
import { adminListContainerClass, adminListDashboardPanelUi } from '~/constants/admin-list-layout';

useHead({
  title: 'Configuración de SLA',
});

const activeTab = ref<SlaConfigTabValue>('stages');
const sla = useSlaConfiguration();
const isSlaLoading = computed(() => sla.loadStatus.value === 'loading');

provide(slaConfigurationKey, sla);

onMounted(() => {
  void sla.load();
});
</script>

<template>
  <UDashboardPanel :ui="adminListDashboardPanelUi">
    <template #header>
      <SharedNavbar title="Configuración SLA" />
    </template>
    <template #body>
      <UContainer :class="adminListContainerClass">
        <div class="flex shrink-0 flex-col gap-1">
          <h1 class="text-3xl font-bold tracking-tight">
            Configuración de SLA
          </h1>
          <p class="text-sm text-muted">
            Define tiempos máximos por etapa y niveles de alerta.
          </p>
        </div>

        <USeparator class="shrink-0" />

        <div
          v-if="isSlaLoading"
          class="flex flex-1 items-center justify-center py-12"
        >
          <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-muted" />
        </div>

        <UTabs
          v-else
          v-model="activeTab"
          :items="[...SLA_TAB_ITEMS]"
          class="flex min-h-0 flex-1 flex-col gap-4"
          :ui="{ list: 'shrink-0 flex-wrap' }"
        >
          <template #stages>
            <AdminSlaConfigSlaStagesTab />
          </template>
          <template #alerts>
            <AdminSlaConfigSlaAlertLevelsTab />
          </template>
          <template #chat>
            <AdminSlaConfigSlaChatUpdatesTab />
          </template>
        </UTabs>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
