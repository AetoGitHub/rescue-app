<script setup lang="ts">
const open = defineModel<boolean>('open', { required: true });

defineProps<{
  message: string;
}>();
</script>

<template>
  <UModal
    v-model:open="open"
    title="Rescate bloqueado"
    :ui="{ content: 'max-w-md' }"
  >
    <template #body>
      <p class="text-sm text-muted">
        {{ message }}
      </p>
    </template>

    <template #footer>
      <div class="flex w-full justify-end">
        <UButton
          type="button"
          color="primary"
          variant="solid"
          label="Entendido"
          @click="open = false"
        />
      </div>
    </template>
  </UModal>
</template>
