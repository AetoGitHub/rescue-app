<script setup lang="ts">
const { isMobile } = useResponsive();
</script>

<template>
  <div v-if="isMobile" class="flex min-h-0 flex-1 flex-col gap-2">
    <slot name="cards" />
  </div>
  <div v-else class="flex min-h-0 flex-1 flex-col">
    <slot />
  </div>
</template>
