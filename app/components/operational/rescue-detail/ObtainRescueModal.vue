<script setup lang="ts">
import { RESCUE_OBTAIN_MODAL_COPY } from '~/constants/rescue-operative-flow';

const open = defineModel<boolean>('open', { required: true });

defineProps<{
  folio?: string | null;
  loading?: boolean;
}>();

const emit = defineEmits<{
  submit: [];
}>();
</script>

<template>
  <UModal
    v-model:open="open"
    :dismissible="false"
    :title="RESCUE_OBTAIN_MODAL_COPY.title"
    :ui="{ content: 'max-w-md' }"
  >
    <template #body>
      <div class="space-y-2">
        <p class="text-sm text-muted">
          {{ RESCUE_OBTAIN_MODAL_COPY.description }}
        </p>
        <p v-if="folio" class="text-sm font-medium text-highlighted">
          Folio: {{ folio }}
        </p>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          type="button"
          color="neutral"
          variant="subtle"
          :label="RESCUE_OBTAIN_MODAL_COPY.cancelLabel"
          :disabled="loading"
          @click="() => { open = false }"
        />
        <UButton
          type="button"
          color="primary"
          :label="RESCUE_OBTAIN_MODAL_COPY.confirmLabel"
          :loading="loading"
          @click="emit('submit')"
        />
      </div>
    </template>
  </UModal>
</template>
