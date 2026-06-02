<script setup lang="ts">
const open = defineModel<boolean>('open', { required: true });

defineProps<{
  loading?: boolean;
}>();

const emit = defineEmits<{
  submit: [];
}>();
</script>

<template>
  <UModal
    v-model:open="open"
    title="Abrir garantía"
    :ui="{ content: 'max-w-md' }"
  >
    <template #body>
      <p class="text-sm text-muted mb-4">
        La solicitud pasará a garantía pendiente operativamente y al estatus
        Garantía en el flujo administrativo.
      </p>
      <UButton
        block
        color="warning"
        label="Abrir garantía"
        :loading="loading"
        @click="emit('submit')"
      />
    </template>
  </UModal>
</template>
