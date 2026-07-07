<script setup lang="ts">
import type { SlaConfigTabValue } from '~/constants/sla-config';
import { SLA_TAB_ITEMS } from '~/constants/sla-config';
import { adminLinkTabsClass, adminLinkTabsUi } from '~/constants/tabs-layout';
import { slaConfigurationKey } from '~/composables/useSlaConfiguration';

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
  <UDashboardPanel>
    <template #header>
      <SharedNavbar title="Configuración SLA" />
    </template>
    <template #body>
      <UContainer>
        <div class="flex flex-col gap-4 pb-6">
          <div class="flex flex-col gap-1">
            <h1 class="text-2xl font-bold tracking-tight sm:text-3xl">
              Configuración de SLA
            </h1>
            <p class="text-sm text-muted">
              Define tiempos máximos por etapa y niveles de alerta.
            </p>
          </div>

          <USeparator />

          <div
            v-if="isSlaLoading"
            class="flex items-center justify-center py-12"
          >
            <UIcon
              name="i-lucide-loader-circle"
              class="size-8 animate-spin text-muted"
            />
          </div>

          <UTabs
            v-else
            v-model="activeTab"
            :items="[...SLA_TAB_ITEMS]"
            :class="adminLinkTabsClass"
            :ui="adminLinkTabsUi"
            variant="link"
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
        </div>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
