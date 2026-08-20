<script setup lang="ts">
import type { Form, FormSubmitEvent } from '@nuxt/ui';
import {
  tmsRescueDraftSchema,
  tmsRescueDraftToUpdateBody,
  type TmsRescueDraftOutput,
  type TmsRescueDraftState,
} from '~/schemas/tms-portal';
import type {
  TmsRescue,
  TmsRescueUpdateBody,
} from '~/interfaces/portals/tms';

const open = defineModel<boolean>('open', { required: true });

const props = defineProps<{
  rescue: TmsRescue | null;
  loading?: boolean;
}>();

const emit = defineEmits<{
  apply: [payload: { rescueId: number; body: TmsRescueUpdateBody }];
}>();

const formRef = useTemplateRef<Form<TmsRescueDraftState>>('formRef');
const state = reactive<TmsRescueDraftState>({
  internal_notes: '',
  oc_pdf: '',
});

watch(
  () => [open.value, props.rescue] as const,
  ([isOpen, rescue]) => {
    if (!isOpen || !rescue) return;
    state.internal_notes = rescue.internal_notes;
    state.oc_pdf = rescue.oc_pdf ?? '';
  },
  { immediate: true },
);

function onSubmit(event: FormSubmitEvent<TmsRescueDraftOutput>) {
  if (!props.rescue || props.loading) return;
  emit('apply', {
    rescueId: props.rescue.id,
    body: tmsRescueDraftToUpdateBody(props.rescue.id, event.data),
  });
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="rescue ? `Editar ${rescue.folio}` : 'Editar rescate'"
    description="Guarda las notas internas y el PDF de la orden de compra de este rescate."
    :ui="{ content: 'max-w-xl' }"
  >
    <template #body>
      <UForm
        ref="formRef"
        :schema="tmsRescueDraftSchema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField
          label="Notas internas"
          name="internal_notes"
        >
          <UTextarea
            v-model="state.internal_notes"
            :rows="4"
            autoresize
            :maxrows="8"
            placeholder="Notas para el seguimiento del rescate"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="PDF de la orden de compra"
          name="oc_pdf"
          description="La URL se asigna al cargar el PDF; puedes retirarla del borrador."
        >
          <div class="flex gap-2">
            <UInput
              v-model="state.oc_pdf"
              readonly
              placeholder="Sin PDF de OC"
              class="min-w-0 flex-1"
            />
            <UButton
              v-if="state.oc_pdf"
              color="neutral"
              variant="outline"
              icon="i-lucide-trash-2"
              aria-label="Retirar PDF de la orden de compra"
              @click="state.oc_pdf = ''"
            />
          </div>
        </UFormField>
      </UForm>
    </template>

    <template #footer="{ close }">
      <div class="flex w-full justify-end gap-2">
        <UButton
          color="neutral"
          variant="outline"
          label="Cancelar"
          :disabled="loading"
          @click="close"
        />
        <UButton
          label="Guardar"
          icon="i-lucide-check"
          :loading="loading"
          :disabled="loading"
          @click="formRef?.submit()"
        />
      </div>
    </template>
  </UModal>
</template>
