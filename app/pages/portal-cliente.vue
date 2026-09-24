<script setup lang="ts">
definePageMeta({
  layout: 'client-portal',
  middleware: ['auth', 'client-portal'],
});

// Precarga ambos reportes mientras se está en el portal: al pasar de Por
// Facturar a Por Cobrar (y de regreso) los datos ya están en caché y solo se
// refrescan en segundo plano, en vez de arrancar con la pantalla vacía.
usePendingReportScope().value = 'client';
usePendingInvoiceList();
usePendingInvoiceSummary();
usePendingChargeList();
usePendingChargeSummary();
</script>

<template>
  <NuxtPage :transition="{ name: 'portal-page', mode: 'out-in' }" />
</template>

<style>
.portal-page-enter-active {
  transition: opacity 180ms ease-out, transform 180ms ease-out;
}

.portal-page-leave-active {
  transition: opacity 90ms ease-in;
}

.portal-page-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.portal-page-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .portal-page-enter-active,
  .portal-page-leave-active {
    transition: none;
  }

  .portal-page-enter-from {
    transform: none;
  }
}
</style>
