<script setup lang="ts">
const open = defineModel<boolean>('open', { required: true });

const props = defineProps<{
  loading?: boolean;
}>();

const emit = defineEmits<{
  submit: [];
}>();

const cancelReason = defineModel<string>('cancelReason', { required: true });

function onSubmit() {
  emit('submit');
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Cancelar servicio"
    :ui="{ content: 'max-w-md' }"
  >
    <template #body>
      <UFormField
        label="Motivo de cancelación"
        name="cancel_reason"
        required
      >
        <UTextarea
          v-model="cancelReason"
          class="w-full"
          :rows="4"
          placeholder="Describe el motivo"
        />
      </UFormField>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          color="neutral"
          label="Cerrar"
          variant="subtle"
          @click="open = false"
        />
        <UButton
          color="error"
          label="Cancelar servicio"
          :loading="loading"
          @click="onSubmit"
        />
      </div>
    </template>
  </UModal>
</template>
