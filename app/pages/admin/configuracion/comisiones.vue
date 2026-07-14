<script setup lang="ts">
import {
  adminListContainerClass,
  adminListDashboardPanelUi,
  adminListPageTitleClass,
} from '~/constants/admin-list-layout';

useHead({
  title: 'Configuración de comisiones',
});
</script>

<template>
  <UDashboardPanel :ui="adminListDashboardPanelUi">
    <template #header>
      <SharedNavbar title="Configuración de comisiones" />
    </template>

    <template #body>
      <UContainer :class="adminListContainerClass">
        <div class="shrink-0 flex flex-col gap-1">
          <p class="text-xs font-semibold uppercase tracking-wider text-muted">
            Módulo Administración
          </p>
          <h1 :class="adminListPageTitleClass">
            Configuración de comisiones
          </h1>
          <p class="text-sm text-muted">
            Defaults globales y overrides por gestor.
          </p>
        </div>

        <USeparator class="shrink-0" />

        <AdminCommissionConfigOperatorOverridesSection class="min-h-0 flex-1" />
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
