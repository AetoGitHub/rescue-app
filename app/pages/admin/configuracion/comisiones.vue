<script setup lang="ts">
useHead({
  title: 'Configuración de comisiones',
});
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <SharedNavbar title="Configuración de comisiones" />
    </template>

    <template #body>
      <UContainer>
        <div class="flex flex-col gap-6 pb-6">
          <div class="flex flex-col gap-1">
            <p class="text-xs font-semibold uppercase tracking-wider text-muted">
              Módulo Administración
            </p>
            <h1 class="text-3xl font-bold tracking-tight">
              Configuración de comisiones
            </h1>
            <p class="text-sm text-muted">
              Defaults globales y overrides por gestor.
            </p>
          </div>

          <USeparator />

          <AdminCommissionConfigOperatorOverridesSection />
        </div>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
