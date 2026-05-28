<script setup lang="ts">
useHead({
  title: 'Dashboard',
});
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <SharedNavbar title="Dashboard" />
    </template>
  </UDashboardPanel>
</template>
