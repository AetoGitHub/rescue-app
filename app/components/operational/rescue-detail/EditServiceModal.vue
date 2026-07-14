<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui';
import type { z } from 'zod';
import {
  emptyRescueServiceUpdateState,
  rescueServiceUpdateSchema,
  rescueServiceUpdateToBody,
  type RescueServiceUpdateFormState,
} from '~/schemas/rescue-service-update';

const open = defineModel<boolean>('open', { required: true });

const props = defineProps<{
  rescueId: number;
  vehicle: string | null;
  serviceDescription: string;
  internalNotes: string | null | undefined;
}>();

const emit = defineEmits<{
  saved: [];
}>();

const formRef = ref<{ submit: () => Promise<void> } | null>(null);
const state = reactive<RescueServiceUpdateFormState>(emptyRescueServiceUpdateState());

const { saveService, isUpdating } = useRescueServiceUpdate(() => props.rescueId);

watch(open, (isOpen) => {
  if (!isOpen) return;
  state.vehicle = props.vehicle?.trim() ?? '';
  state.service_description = props.serviceDescription?.trim() ?? '';
  state.internal_notes = props.internalNotes?.trim() ?? '';
});

async function onSubmit(
  event: FormSubmitEvent<z.infer<typeof rescueServiceUpdateSchema>>,
) {
  const body = rescueServiceUpdateToBody(event.data);
  const ok = await saveService(body);
  if (ok) {
    open.value = false;
    emit('saved');
  }
}

function onSaveClick() {
  void formRef.value?.submit();
}
</script>

<template>
  <UModal
    v-model:open="open"
    :dismissible="false"
    title="Editar servicio"
    :ui="{ content: 'max-w-md' }"
  >
    <template #body>
      <UForm
        ref="formRef"
        :schema="rescueServiceUpdateSchema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField
          label="Núm. económico"
          name="vehicle"
        >
          <UInput
            v-model="state.vehicle"
            class="w-full"
            placeholder="Número económico"
          />
        </UFormField>

        <UFormField
          label="Descripción del servicio"
          name="service_description"
        >
          <UTextarea
            v-model="state.service_description"
            class="w-full"
            :rows="3"
          />
        </UFormField>

        <UFormField
          label="Notas internas"
          name="internal_notes"
        >
          <UTextarea
            v-model="state.internal_notes"
            class="w-full"
            :rows="3"
          />
        </UFormField>
      </UForm>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          color="neutral"
          label="Cancelar"
          variant="subtle"
          :disabled="isUpdating"
          @click="() => { open = false }"
        />
        <UButton
          color="primary"
          label="Guardar"
          :loading="isUpdating"
          :disabled="isUpdating"
          @click="onSaveClick"
        />
      </div>
    </template>
  </UModal>
</template>
