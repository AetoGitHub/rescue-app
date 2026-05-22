<script setup lang="ts">
import { useMutation } from '@pinia/colada';
import type { FormSubmitEvent } from '@nuxt/ui';
import type { Client } from '~/interfaces/catalogs/client';
import type { RescueCreateResponse } from '~/interfaces/rescue';
import type { RescueQuoteCreateResponse } from '~/interfaces/rescue/quote';
import type { CatalogDropdownRow } from '~/interfaces/shared/catalog-dropdown.interface';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';
import {
  emptyRescueRequestState,
  getStepSchemaForIndex,
  rescueCreateFormSchema,
  rescueFormToCreateBody,
  getRescueStepQuoteWithSettingsSchema,
  type RescueCreateFormOutput,
  type RescueRequestFormState,
} from '~/schemas/rescue-create';

const toast = useToast();

const open = ref(false);
const currentStep = ref(0);
const stepError = ref<string | null>(null);

const state = reactive<RescueRequestFormState>(emptyRescueRequestState());

const stepItems = computed(() => getRescueStepItems(state.service_type));
const lastStepIndex = computed(() => getRescueStepCount(state.service_type) - 1);
const isLastStep = computed(() => currentStep.value >= lastStepIndex.value);

const currentStepKind = computed(() =>
  getWizardStepKind(currentStep.value, state.service_type),
);

const isSupplierStep = computed(
  () => currentStepKind.value === 'supplier',
);

const isWideStep = computed(
  () => currentStepKind.value === 'supplier' || currentStepKind.value === 'quote',
);

const modalContentClass = computed(() =>
  isWideStep.value ? 'max-w-6xl' : 'max-w-2xl',
);

function clearFormState() {
  Object.assign(state, emptyRescueRequestState());
  stepError.value = null;
}

function resetWizard() {
  clearFormState();
  currentStep.value = 0;
}

function scheduleStepResetAfterClose() {
  nextTick(() => {
    if (!open.value) {
      currentStep.value = 0;
    }
  });
}

function openCreate() {
  resetWizard();
  open.value = true;
}

defineExpose({ openCreate });

watch(open, (isOpen) => {
  if (!isOpen) {
    clearFormState();
    scheduleStepResetAfterClose();
  }
});

watch(
  () => state.service_type,
  () => {
    currentStep.value = 0;
    stepError.value = null;
    state.quote_lines = initialQuoteLinesForServiceType(state.service_type);
    if (!hasExtendedRescueWizardFlow(state.service_type)) {
      state.supplier = null;
      state.supplierLabel = '';
      state.service_description = '';
      state.location_latitude = null;
      state.location_longitude = null;
      state.location_description = '';
    }
  },
);

watch(
  () => state.client,
  async (id, _prev, onCleanup) => {
    let active = true;
    onCleanup(() => {
      active = false;
    });

    if (id == null) {
      if (active) state.clientLabel = '';
      return;
    }
    try {
      const raw = await $fetch<Record<string, unknown>>(
        `/api/catalogue/client/detail/${id}/`,
      );
      if (!active) return;
      state.clientLabel = String(raw.name ?? '').trim() || `Cliente #${id}`;
    } catch {
      if (!active) return;
      state.clientLabel = `Cliente #${id}`;
    }
  },
);

async function fetchClientDropdown(
  name: string,
  options?: { signal?: AbortSignal },
) {
  const signal = options?.signal;
  try {
    return await $fetch<PaginatedResponse<CatalogDropdownRow>>(
      '/api/catalogue/client/dropdown/',
      { query: { name }, signal },
    );
  } catch {
    const res = await $fetch<PaginatedResponse<Client>>(
      '/api/catalogue/client/list/',
      { query: { name }, signal },
    );
    return {
      next: res.next,
      previous: res.previous,
      results: res.results.map((c) => ({ id: c.id, name: c.name })),
    };
  }
}

function fetchServiceDropdown(
  name: string,
  options?: { signal?: AbortSignal },
) {
  return $fetch<PaginatedResponse<CatalogDropdownRow>>(
    '/api/catalogue/service/dropdown/',
    { query: { name }, signal: options?.signal },
  );
}

function fetchManagerDropdown(
  name: string,
  options?: { signal?: AbortSignal },
) {
  return $fetch<PaginatedResponse<Record<string, unknown>>>(
    '/api/auth/user/dropdown/',
    { query: { role: 'operator', name }, signal: options?.signal },
  ).then((res) => ({
    next: res.next,
    previous: res.previous,
    results: (res.results ?? []).map(mapUserDropdownRow),
  }));
}

const { mutate, asyncStatus } = useMutation({
  mutation: async (payload: {
    form: RescueCreateFormOutput;
    companySettings: RescueRequestFormState['company_settings'];
  }) => {
    const rescueBody = rescueFormToCreateBody(payload.form);
    const rescue = await $fetch<RescueCreateResponse>('/api/rescue/', {
      method: 'POST',
      body: rescueBody,
    });

    const quoteBody = buildRescueQuoteCreateBody(
      rescue.id,
      payload.form.quote_lines,
      payload.companySettings,
    );

    if (quoteBody) {
      try {
        await $fetch<RescueQuoteCreateResponse>('/api/rescue/quote/create/', {
          method: 'POST',
          body: quoteBody,
        });
      } catch (quoteError) {
        console.error(quoteError);
        toast.add({
          title: 'Rescate creado; cotización no guardada',
          description: `Folio: ${rescue.folio}. ${getFetchErrorMessage(quoteError)}`,
          color: 'error',
        });
        open.value = false;
        return rescue;
      }
    }

    const description = quoteBody
      ? `Folio: ${rescue.folio}. Cotización guardada.`
      : `Folio: ${rescue.folio}`;

    toast.add({
      title: 'Solicitud creada',
      description,
      color: 'success',
    });
    open.value = false;
    return rescue;
  },
  onError: (e) => {
    console.error(e);
    toast.add({
      title: 'No se pudo crear la solicitud',
      description: getFetchErrorMessage(e),
      color: 'error',
    });
  },
});

const formRef = ref<{ submit: () => Promise<void> } | null>(null);

function pickStepPayload(stepIndex: number) {
  const kind = getWizardStepKind(stepIndex, state.service_type);

  switch (kind) {
    case 'basics':
      return {
        service_type: state.service_type,
        client: state.client,
        general_public: state.general_public,
        serialNumber: state.serialNumber,
        manager: state.manager,
      };
    case 'quote':
      return {
        quote_lines: state.quote_lines,
        company_settings: state.company_settings,
      };
    case 'location':
      return {
        location_latitude: state.location_latitude,
        location_longitude: state.location_longitude,
        location_description: state.location_description,
        service_description: state.service_description,
      };
    case 'supplier':
      return { supplier: state.supplier };
    case 'summary':
      return { internal_notes: state.internal_notes };
    default:
      return {};
  }
}

function validateCurrentStep(): boolean {
  stepError.value = null;
  const kind = getWizardStepKind(currentStep.value, state.service_type);
  const schema =
    kind === 'quote'
      ? getRescueStepQuoteWithSettingsSchema(state.service_type)
      : getStepSchemaForIndex(currentStep.value, state.service_type);
  const result = schema.safeParse(pickStepPayload(currentStep.value));
  if (!result.success) {
    const first = result.error.issues[0];
    stepError.value = first?.message ?? 'Revisa los campos del paso actual';
    return false;
  }
  return true;
}

function goNext() {
  if (!validateCurrentStep()) return;
  if (isLastStep.value) return;
  currentStep.value += 1;
  stepError.value = null;
}

function goPrev() {
  if (currentStep.value <= 0) return;
  currentStep.value -= 1;
  stepError.value = null;
}

function skipSupplier() {
  state.supplier = null;
  state.supplierLabel = '';
  goNext();
}

function onSubmit(payload: FormSubmitEvent<RescueCreateFormOutput>) {
  mutate({
    form: payload.data,
    companySettings: state.company_settings,
  });
}

function onFormError() {
  console.error('Validación de formulario de solicitud de rescate');
}

function cancel() {
  open.value = false;
}

async function requestSubmit() {
  await formRef.value?.submit();
}

function onPrimaryAction() {
  if (isLastStep.value) {
    void requestSubmit();
  } else {
    goNext();
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    scrollable
    title="Nueva solicitud"
    :ui="{ content: modalContentClass }"
  >
    <template #body>
      <div v-if="open" class="space-y-4">
        <UStepper
          v-model="currentStep"
          :items="stepItems"
          disabled
          class="mb-6 w-full"
        />

        <UForm
          ref="formRef"
          :schema="rescueCreateFormSchema"
          :state="state"
          class="space-y-4"
          @submit="onSubmit"
          @error="onFormError"
        >
          <OperationalRescueRequestStepsBasicsStep
            v-if="currentStepKind === 'basics'"
            v-model="state"
            :fetch-client-dropdown="fetchClientDropdown"
            :fetch-manager-dropdown="fetchManagerDropdown"
          />

          <OperationalRescueRequestStepsQuoteStep
            v-else-if="currentStepKind === 'quote'"
            v-model="state"
            :fetch-service-dropdown="fetchServiceDropdown"
          />

          <OperationalRescueRequestStepsLocationStep
            v-else-if="currentStepKind === 'location'"
            v-model="state"
          />

          <OperationalRescueRequestStepsSupplierStep
            v-else-if="currentStepKind === 'supplier'"
            v-model="state"
          />

          <OperationalRescueRequestStepsSummaryStep
            v-else-if="currentStepKind === 'summary'"
            v-model="state"
          />

          <p
            v-if="stepError"
            class="text-sm text-error"
            role="alert"
          >
            {{ stepError }}
          </p>
        </UForm>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full flex-wrap items-center justify-between gap-2">
        <UButton
          type="button"
          color="neutral"
          variant="subtle"
          label="Cancelar"
          @click="cancel"
        />
        <div class="flex flex-wrap justify-end gap-2">
          <UButton
            v-if="isSupplierStep"
            type="button"
            color="neutral"
            variant="ghost"
            label="Omitir proveedor"
            @click="skipSupplier"
          />
          <UButton
            v-if="currentStep > 0"
            type="button"
            color="neutral"
            variant="outline"
            icon="i-lucide-chevron-left"
            label="Anterior"
            @click="goPrev"
          />
          <UButton
            type="button"
            :label="isLastStep ? 'Crear solicitud' : 'Siguiente'"
            :icon="isLastStep ? undefined : 'i-lucide-chevron-right'"
            :trailing="!isLastStep"
            :loading="asyncStatus === 'loading'"
            :disabled="asyncStatus === 'loading'"
            @click="onPrimaryAction"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
