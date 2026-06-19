<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'authorization'],
});
</script>

<template>
  <NuxtPage />
</template>
