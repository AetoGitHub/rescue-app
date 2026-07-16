<script setup lang="ts">
import { useMutation, useQueryCache } from '@pinia/colada';
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
import { isOperatorRole } from '#shared/utils/auth-roles';

const toast = useToast();
const queryCache = useQueryCache();
const apiFetch = useApiFetch();
const { assertClientCreditForQuote } = useCreditCheck();
const { user } = useUserSession();

const open = ref(false);
const currentStep = ref(0);
const stepError = ref<string | null>(null);

const state = reactive<RescueRequestFormState>(emptyRescueRequestState());
const {
  guardedOpen,
  discardConfirmOpen,
  requestClose,
  confirmDiscard,
  cancelDiscard,
  closeWithoutConfirm,
  resetDirtySnapshot,
} = useDiscardChangesGuard({
  open,
  snapshot: () => ({ currentStep: currentStep.value, state }),
  alwaysConfirm: true,
});

const isManagerLocked = computed(() => isOperatorRole(user.value?.role));

function applyLockedManager() {
  if (!isManagerLocked.value) return;
  const id = user.value?.id;
  if (id == null) return;
  state.manager = id;
  state.managerLabel = user.value?.name?.trim() || `Usuario #${id}`;
}

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

const showWizardCreditCard = computed(() =>
  shouldShowWizardCreditCard(state.client, state.client_credit_snapshot),
);

const clientCreditPending = computed(
  () => state.client != null && state.client_credit_snapshot == null,
);

function parseClientSellerId(raw: Record<string, unknown>): number | null {
  const seller = raw.seller ?? raw.seller_id;
  if (seller == null || seller === '') return null;
  const id = Number(seller);
  return Number.isFinite(id) && id > 0 ? id : null;
}

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
  applyLockedManager();
  resetDirtySnapshot();
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
      if (active) {
        state.clientLabel = '';
        state.client_credit_snapshot = null;
        state.client_seller_id = null;
      }
      return;
    }
    try {
      const raw = await apiFetch<Record<string, unknown>>(
        `/api/catalogue/client/detail/${id}/`,
      );
      if (!active) return;
      const summary = mapClientCreditSummary(raw);
      state.clientLabel = String(raw.name ?? '').trim() || `Cliente #${id}`;
      state.client_seller_id = parseClientSellerId(raw);
      state.client_credit_snapshot = {
        client_type: normalizeClientType(raw.client_type),
        credit_limit: summary.credit_limit,
        credit_available: summary.credit_available,
      };
    } catch {
      if (!active) return;
      state.clientLabel = `Cliente #${id}`;
      state.client_credit_snapshot = null;
      state.client_seller_id = null;
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
    clientSellerId: number | null;
  }) => {
    const creditGate = await assertClientCreditForQuote(
      payload.form.client,
      payload.form.quote_lines,
      payload.companySettings,
      payload.clientSellerId,
    );
    if (!creditGate.ok) {
      toast.add({
        title: 'Crédito insuficiente',
        description: creditGate.message,
        color: 'error',
      });
      return;
    }

    const rescueBody = rescueFormToCreateBody(payload.form);
    const rescue = await apiFetch<RescueCreateResponse>('/api/rescue/', {
      method: 'POST',
      body: rescueBody,
    });

    const quoteBody = buildRescueQuoteCreateBody(
      rescue.id,
      payload.form.quote_lines,
      payload.companySettings,
      { clientSellerId: payload.clientSellerId },
    );

    if (quoteBody) {
      try {
        await apiFetch<RescueQuoteCreateResponse>('/api/rescue/quote/create/', {
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
        await queryCache.invalidateQueries({ key: ['operational-rescue-cards'] });
        await queryCache.invalidateQueries({ key: ['operational-rescue-list'] });
        await queryCache.invalidateQueries({ key: ['operational-rescue-cards-summary'] });
        closeWithoutConfirm();
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
    await queryCache.invalidateQueries({ key: ['operational-rescue-cards'] });
    await queryCache.invalidateQueries({ key: ['operational-rescue-list'] });
    await queryCache.invalidateQueries({ key: ['operational-rescue-cards-summary'] });
    closeWithoutConfirm();
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

function validateQuoteCredit(): boolean {
  const warning = getWizardQuoteCreditWarning(
    state.client_credit_snapshot,
    state.quote_lines,
    state.company_settings,
    state.client_seller_id,
  );
  if (warning) {
    stepError.value = warning.description;
    return false;
  }
  return true;
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
  if (kind === 'quote' && !validateQuoteCredit()) return false;
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
  applyLockedManager();
  mutate({
    form: {
      ...payload.data,
      manager: state.manager,
    },
    companySettings: state.company_settings,
    clientSellerId: state.client_seller_id,
  });
}

function onFormError() {
  console.error('Validación de formulario de solicitud de rescate');
}

function cancel() {
  requestClose();
}

async function requestSubmit() {
  if (!validateQuoteCredit()) return;
  await formRef.value?.submit();
}

function onPrimaryAction() {
  if (isLastStep.value) {
    void requestSubmit();
  } else {
    goNext();
  }
}

const { isMobile } = useResponsive();

const wizardModalProps = computed(() => {
  if (isMobile.value) {
    return { fullscreen: true, scrollable: true };
  }

  return {
    scrollable: true,
    ui: { content: modalContentClass.value },
  };
});
</script>

<template>
  <UModal
    v-model:open="guardedOpen"
    :dismissible="false"
    title="Nueva solicitud"
    v-bind="wizardModalProps"
  >
    <template #body>
      <div v-if="open" class="space-y-4">
        <UStepper
          v-model="currentStep"
          :items="stepItems"
          disabled
          class="mb-6 w-full overflow-x-auto"
          :ui="{
            wrapper: 'min-w-max sm:min-w-0',
            title: 'hidden sm:block',
          }"
        />

        <UForm
          ref="formRef"
          :schema="rescueCreateFormSchema"
          :state="state"
          class="space-y-4"
          @submit="onSubmit"
          @error="onFormError"
        >
          <template v-if="currentStepKind === 'basics'">
            <OperationalRescueRequestStepsBasicsStep
              v-model="state"
              :fetch-client-dropdown="fetchClientDropdown"
              :fetch-manager-dropdown="fetchManagerDropdown"
              :manager-locked="isManagerLocked"
            />

            <OperationalRescueRequestClientCreditSelectionCard
              v-if="showWizardCreditCard"
              :client-name="state.clientLabel || `Cliente #${state.client}`"
              :snapshot="state.client_credit_snapshot"
              :pending="clientCreditPending"
            />
          </template>

          <LazyOperationalRescueRequestStepsQuoteStep
            v-else-if="currentStepKind === 'quote'"
            v-model="state"
            :fetch-service-dropdown="fetchServiceDropdown"
          />

          <LazyOperationalRescueRequestStepsLocationStep
            v-else-if="currentStepKind === 'location'"
            v-model="state"
          />

          <LazyOperationalRescueRequestStepsSupplierStep
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
      <div class="flex w-full flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <UButton
          type="button"
          class="w-full sm:w-auto"
          color="neutral"
          variant="subtle"
          label="Cancelar"
          @click="cancel"
        />
        <div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
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

  <SharedDiscardChangesConfirmModal
    v-model:open="discardConfirmOpen"
    @confirm="confirmDiscard"
    @cancel="cancelDiscard"
  />
</template>
