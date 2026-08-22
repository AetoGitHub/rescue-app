<script setup lang="ts">
defineProps<{
  label: string;
}>();
</script>

<template>
  <UBadge
    color="error"
    variant="subtle"
    size="sm"
    icon="i-lucide-circle-x"
    :label="label"
  />
</template>
