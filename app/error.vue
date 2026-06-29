<script setup lang="ts">
import type { NuxtError } from '#app';

defineProps<{
  error: NuxtError;
}>();
</script>

<template>
  <UApp>
    <UHeader>
      <template #left>
        <SharedAetoLogo class="size-8" />
      </template>
    </UHeader>

    <UError :error="error" />

    <UFooter />
  </UApp>
</template>
