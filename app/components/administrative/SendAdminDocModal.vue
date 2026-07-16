<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui';
import {
  parseRescueAdminDocInput,
  rescueAdminDocCopySchema,
  rescueAdminDocToBody,
  type RescueAdminDocFormState,
} from '~/schemas/rescue-admin-doc';

const open = defineModel<boolean>('open', { required: true });

const props = defineProps<{
  sourceRescueId: number;
  clientId: number;
  remittanceFolio: string;
  invoiceFolio: string;
  loading?: boolean;
}>();

const emit = defineEmits<{
  submit: [body: ReturnType<typeof rescueAdminDocToBody>];
}>();

type SendStep = 'question' | 'select';

const step = ref<SendStep>('question');
const formRef = ref<{ submit: () => Promise<void> } | null>(null);
const toast = useToast();

const parsedFolios = computed(() => {
  const parsed = parseRescueAdminDocInput({
    remittance_folio: props.remittanceFolio,
    invoice_folio: props.invoiceFolio,
  });
  return parsed.success ? parsed.data : null;
});

const state = reactive<RescueAdminDocFormState>({
  remittance_folio: '',
  invoice_folio: '',
  extra_rescues: [],
});
const {
  guardedOpen,
  discardConfirmOpen,
  requestClose,
  confirmDiscard,
  cancelDiscard,
  resetDirtySnapshot,
} = useDiscardChangesGuard({
  open,
  snapshot: () => ({ step: step.value, state }),
});

watch(open, (isOpen) => {
  if (isOpen) {
    step.value = 'question';
    state.remittance_folio = props.remittanceFolio;
    state.invoice_folio = props.invoiceFolio;
    state.extra_rescues = [];
    resetDirtySnapshot();
  }
});

function submitWithExtraRescues(extraRescues: number[]) {
  const parsed = rescueAdminDocCopySchema.safeParse({
    remittance_folio: props.remittanceFolio,
    invoice_folio: props.invoiceFolio,
    extra_rescues: extraRescues,
  });
  if (!parsed.success) {
    toast.add({
      title: parsed.error.issues[0]?.message ?? 'Revisa los folios',
      color: 'error',
    });
    return;
  }
  emit('submit', rescueAdminDocToBody(parsed.data));
}

function onOnlyThisRescue() {
  submitWithExtraRescues([]);
}

function onSelectOthers() {
  step.value = 'select';
}

function onBack() {
  step.value = 'question';
  state.extra_rescues = [];
}

function onSubmit(event: FormSubmitEvent<RescueAdminDocFormState>) {
  emit('submit', rescueAdminDocToBody(event.data));
}

function onApplySelected() {
  void formRef.value?.submit();
}
</script>

<template>
  <UModal
    v-model:open="guardedOpen"
    :dismissible="false"
    title="Enviar documentos"
    :ui="{ content: 'max-w-lg' }"
  >
    <template #body>
      <div class="space-y-4">
        <div class="rounded-lg border border-default bg-muted/20 px-3 py-2 text-sm">
          <p class="text-xs font-medium uppercase text-muted">
            Folios a enviar
          </p>
          <p
            v-if="parsedFolios?.remittance_folio"
            class="mt-1 text-highlighted"
          >
            <span class="text-muted">Remisión (OC):</span>
            {{ parsedFolios.remittance_folio }}
          </p>
          <p
            v-if="parsedFolios?.invoice_folio"
            class="text-highlighted"
          >
            <span class="text-muted">Factura:</span>
            {{ parsedFolios.invoice_folio }}
          </p>
        </div>

        <template v-if="step === 'question'">
          <p class="text-sm text-highlighted">
            ¿Deseas aplicar los mismos folios a otros rescates?
          </p>
        </template>

        <template v-else>
          <UForm
            ref="formRef"
            :schema="rescueAdminDocCopySchema"
            :state="state"
            class="space-y-3"
            @submit="onSubmit"
          >
            <UFormField
              label="Otros rescates"
              name="extra_rescues"
              hint="Busca por folio y selecciona uno o más rescates"
            >
              <AdministrativeRescueDropdownMultiSelect
                v-model="state.extra_rescues"
                :exclude-rescue-id="sourceRescueId"
                :client-id="clientId"
                :disabled="loading"
              />
            </UFormField>

            <UFormField name="remittance_folio" class="hidden" />
            <UFormField name="invoice_folio" class="hidden" />
          </UForm>
        </template>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full flex-wrap justify-end gap-2">
        <template v-if="step === 'question'">
          <UButton
            color="neutral"
            label="Cancelar"
            variant="subtle"
            :disabled="loading"
            @click="requestClose"
          />
          <UButton
            color="neutral"
            label="Sí, seleccionar otros"
            variant="outline"
            :disabled="loading"
            @click="onSelectOthers"
          />
          <UButton
            color="primary"
            label="No, solo este rescate"
            :loading="loading"
            @click="onOnlyThisRescue"
          />
        </template>

        <template v-else>
          <UButton
            color="neutral"
            label="Atrás"
            variant="subtle"
            :disabled="loading"
            @click="onBack"
          />
          <UButton
            color="primary"
            label="Enviar"
            :loading="loading"
            @click="onApplySelected"
          />
        </template>
      </div>
    </template>
  </UModal>

  <SharedDiscardChangesConfirmModal
    v-model:open="discardConfirmOpen"
    @confirm="confirmDiscard"
    @cancel="cancelDiscard"
  />
</template>
