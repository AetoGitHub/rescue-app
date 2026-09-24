<script setup lang="ts">
definePageMeta({
  layout: 'client-portal',
  middleware: ['auth', 'client-portal'],
});
</script>

<template>
  <NuxtPage />
</template>
