<script setup lang="ts">
const open = defineModel<boolean>('open', { required: true });

const props = withDefaults(
  defineProps<{
    title?: string;
    description?: string;
    cancelLabel?: string;
    confirmLabel?: string;
  }>(),
  {
    title: '¿Cerrar sin guardar?',
    description: 'Si cierras ahora, perderás el progreso capturado.',
    cancelLabel: 'Seguir editando',
    confirmLabel: 'Cerrar sin guardar',
  },
);

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();

function cancel() {
  open.value = false;
  emit('cancel');
}
</script>

<template>
  <UModal
    v-model:open="open"
    :dismissible="false"
    :title="props.title"
    :ui="{ content: 'max-w-md' }"
  >
    <template #body>
      <p class="text-sm text-muted">
        {{ props.description }}
      </p>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          type="button"
          color="neutral"
          variant="subtle"
          :label="props.cancelLabel"
          @click="cancel"
        />
        <UButton
          type="button"
          color="error"
          variant="solid"
          :label="props.confirmLabel"
          @click="emit('confirm')"
        />
      </div>
    </template>
  </UModal>
</template>
