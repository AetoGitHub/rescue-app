<script setup lang="ts">
import type { RescueRemittanceFormState } from '~/interfaces/rescue/administrative';

const open = defineModel<boolean>('open', { required: true });

const props = defineProps<{
  loading?: boolean;
}>();

const emit = defineEmits<{
  submit: [];
  regenerate: [];
}>();

const form = defineModel<RescueRemittanceFormState>('form', { required: true });

function onSubmit() {
  if (props.loading) return;
  emit('submit');
}
</script>

<template>
  <UModal
    v-model:open="open"
    :dismissible="false"
    title="Emitir remisión"
    :ui="{ content: 'max-w-md' }"
  >
    <template #body>
      <div class="space-y-3">
        <UFormField
          label="Número de remisión"
          name="remittance_number"
          required
        >
          <div class="flex gap-2">
            <UInput
              v-model="form.remittance_number"
              class="w-full"
            />
            <UButton
              color="neutral"
              icon="i-lucide-refresh-cw"
              variant="subtle"
              :disabled="loading"
              @click="emit('regenerate')"
            />
          </div>
        </UFormField>

        <UButton
          block
          color="primary"
          label="Confirmar remisión"
          :loading="loading"
          :disabled="loading"
          @click="onSubmit"
        />
      </div>
    </template>
  </UModal>
</template>
