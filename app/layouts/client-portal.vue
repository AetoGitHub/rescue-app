<script setup lang="ts">
import { CLIENT_NAV_SECTIONS } from '~/composables/useAdminNavConfig';
</script>

<template>
  <UDashboardGroup storage="local" storage-key="rescue-client-portal">
    <SharedSidebar :sections="CLIENT_NAV_SECTIONS" />

    <slot />
  </UDashboardGroup>
</template>
