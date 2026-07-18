<script setup lang="ts">
import { useMutation, useQueryCache } from '@pinia/colada';
import type { FormSubmitEvent } from '@nuxt/ui';
import type { ClientCreateBody } from '~/interfaces/catalogs/client';
import type { CatalogDropdownRow } from '~/interfaces/shared/catalog-dropdown.interface';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';
import type { infer as ZodInfer } from 'zod';
import {
  BILLING_TYPE_OPTIONS,
  CLIENT_TYPE_OPTIONS,
  COMMISSION_TYPE_OPTIONS,
} from '~/constants/catalog-select-options';
import type { ClientCreditSummary, CreditFormState } from '~/interfaces/catalogs/credit';
import { clientCreateSchema, creditFormSchema, creditFormToCreateBody } from '~/schemas/catalog-create';
import {
  adminListSlideoverBodyUi,
  adminListSlideoverContentClass,
  adminListSlideoverScrollClass,
} from '~/constants/admin-list-layout';
import { slideoverTabsUi } from '~/constants/tabs-layout';

const toast = useToast();

type ClientFormState = Omit<
  ZodInfer<typeof clientCreateSchema>,
  'company' | 'seller'
> & {
  company?: number;
  seller?: number;
  companyLabel: string;
  sellerLabel: string;
};

const open = ref(false);
const editingId = ref<number | null>(null);
const editingCreditId = ref<number | null>(null);
const clientDetailRaw = ref<Record<string, unknown> | null>(null);
const clientDetailLoaded = ref(false);
const clientDetailPending = ref(false);
const editTab = ref<'general' | 'credit' | 'contacts' | 'csf'>('general');

const isEdit = computed(() => editingId.value != null);

const editTabItems = [
  { label: 'General', value: 'general', slot: 'general' as const },
  { label: 'Crédito', value: 'credit', slot: 'credit' as const },
  { label: 'Contactos', value: 'contacts', slot: 'contacts' as const },
  { label: 'CSF', value: 'csf', slot: 'csf' as const },
];

const clientCsfUrl = ref<string | null>(null);

function emptyCreditState(): CreditFormState {
  return {
    limit: '50000.00',
    days: 30,
    extension: 15,
    remision_tolerance: 3,
    requires_purchase_order: false,
    is_blocked: false,
  };
}

function emptyCreditSummary(): ClientCreditSummary {
  return {
    credit_limit: null,
    credit_used: null,
    credit_available: null,
    overdue_invoices_count: 0,
    due_soon_invoices_count: 0,
  };
}

function emptyState(): ClientFormState {
  return {
    name: '',
    business_name: '',
    rfc: '',
    phone: '',
    email: '',
    address: '',
    client_type: 'CASH',
    billing_type: 'MANUAL',
    commission_type: 'FIXED',
    commission_value: '0.00',
    commission_fixed: '0.00',
    price_multiplier: '1.00',
    loan_multiplier: '1.00',
    company: undefined,
    seller: undefined,
    companyLabel: '',
    sellerLabel: '',
    notes: '',
    is_active: true,
  };
}

const state = reactive(emptyState());
const creditState = reactive(emptyCreditState());
const creditSummary = reactive(emptyCreditSummary());
const commissionValueModel = useCommissionValueModel(
  toRef(state, 'commission_value'),
  toRef(state, 'commission_type'),
);
const commissionFixedModel = useStringNumberModel(
  toRef(state, 'commission_fixed'),
);
const priceMultiplierModel = useStringNumberModel(
  toRef(state, 'price_multiplier'),
);
const loanMultiplierModel = useStringNumberModel(
  toRef(state, 'loan_multiplier'),
);

const showEditCreditTabs = computed(() => isEdit.value);
const showCreateCreditSection = computed(
  () =>
    !isEdit.value
    && (state.client_type === 'CREDIT' || companyCreditInherited.value),
);
const hasLinkedCredit = computed(() => editingCreditId.value != null);

const companyCredit = useCompanyCredit({
  companyId: computed(() => (isEdit.value ? null : state.company ?? null)),
  enabled: computed(() => !isEdit.value && state.company != null),
});

/** Company already has its own credit line: show it read-only, never create client credit. */
const companyCreditInherited = computed(
  () =>
    !isEdit.value
    && state.company != null
    && companyCredit.hasCreditLine.value,
);

watch(
  () => [companyCreditInherited.value, companyCredit.form.value] as const,
  ([inherited, form], [wasInherited]) => {
    if (isEdit.value) return;
    if (inherited) {
      Object.assign(creditState, form);
    } else if (wasInherited) {
      Object.assign(creditState, emptyCreditState());
    }
  },
);

const clientCredit = useClientCredit({
  clientId: computed(() => editingId.value),
  clientDetailFallback: clientDetailRaw,
  clientType: computed(() => state.client_type),
  enabled: computed(
    () => isEdit.value && editingId.value != null && clientDetailLoaded.value,
  ),
});

const clientCreditInvoices = useClientCreditInvoices({
  clientId: computed(() => editingId.value),
  enabled: computed(
    () =>
      isEdit.value
      && editingId.value != null
      && editTab.value === 'credit'
      && clientDetailLoaded.value,
  ),
});

const detailPending = computed(
  () =>
    clientDetailPending.value
    || (isEdit.value && clientDetailLoaded.value && clientCredit.isPending.value),
);

const creditTabInvoiceBindings = computed(() => ({
  invoices: clientCreditInvoices.rows.value,
  invoicesLoading: clientCreditInvoices.isInitialLoading.value,
  hasMoreInvoices: clientCreditInvoices.hasNextPage.value,
  invoicesAsyncStatus: clientCreditInvoices.asyncStatus.value,
}));

const formRef = ref<{ submit: () => Promise<void>; $el?: HTMLElement } | null>(null);
const clientSlideoverScrollRoot = computed(() => formRef.value?.$el ?? null);
const creditFormSectionRef = ref<{ submit: () => Promise<void> } | null>(null);
const pendingClientData = ref<ZodInfer<typeof clientCreateSchema> | null>(null);
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
  snapshot: () => ({ state, creditState, clientCsfUrl: clientCsfUrl.value }),
});

function resetForm() {
  Object.assign(state, emptyState());
  Object.assign(creditState, emptyCreditState());
  Object.assign(creditSummary, emptyCreditSummary());
  editingCreditId.value = null;
  clientDetailRaw.value = null;
  clientDetailLoaded.value = false;
  editTab.value = 'general';
  clientCsfUrl.value = null;
  pendingClientData.value = null;
}

function prepareCreate() {
  editingId.value = null;
  resetForm();
  resetDirtySnapshot();
}

function syncCreditFromComposable() {
  const view = clientCredit.view.value;
  if (!view) return;
  editingCreditId.value = view.creditId;
  Object.assign(creditState, view.form);
  Object.assign(creditSummary, emptyCreditSummary(), view.summary);
}

watch(
  () => clientCredit.view.value,
  () => {
    syncCreditFromComposable();
    resetDirtySnapshot();
  },
);

async function loadDetail(id: number) {
  clientDetailPending.value = true;
  clientDetailLoaded.value = false;
  clientDetailRaw.value = null;
  editingCreditId.value = null;
  try {
    const raw = await $fetch<Record<string, unknown>>(
      `/api/catalogue/client/detail/${id}/`,
    );
    const mapped = mapClientDetail(raw);
    Object.assign(state, emptyState(), mapped, {
      companyLabel: String(raw.company_name ?? '').trim(),
      sellerLabel: String(raw.seller_name ?? '').trim(),
    });
    clientDetailRaw.value = raw;
    clientCsfUrl.value = mapClientCsfUrl(raw);
    clientDetailLoaded.value = true;
  } catch (e) {
    console.error(e);
    toast.add({
      title: 'No se pudo cargar el cliente',
      description: getFetchErrorMessage(e),
      color: 'error',
    });
  } finally {
    clientDetailPending.value = false;
    resetDirtySnapshot();
  }
}

async function openEdit(id: number) {
  editingId.value = id;
  resetForm();
  open.value = true;
  await loadDetail(id);
}

function onCsfSaved(url: string) {
  clientCsfUrl.value = url;
  if (clientDetailRaw.value) {
    clientDetailRaw.value = { ...clientDetailRaw.value, csf: url };
  }
}

defineExpose({ openEdit });

watch(open, (v) => {
  if (!v) {
    editingId.value = null;
    resetForm();
  }
});

watch(
  () => state.company,
  async (companyId, prev, onCleanup) => {
    if (isEdit.value || companyId == null || companyId === prev) return;

    let active = true;
    onCleanup(() => {
      active = false;
    });

    try {
      const raw = await $fetch<Record<string, unknown>>(
        `/api/catalogue/company/detail/${companyId}/`,
      );
      if (!active) return;
      applyCompanyDetailToClientDraft(state, mapCompanyDetail(raw));
    } catch (e) {
      if (!active) return;
      console.error(e);
      toast.add({
        title: 'No se pudo cargar la compañía',
        description: getFetchErrorMessage(e),
        color: 'error',
      });
    }
  },
);

function fetchCompanyDropdown(
  name: string,
  options?: { signal?: AbortSignal },
) {
  return $fetch<PaginatedResponse<CatalogDropdownRow>>(
    '/api/catalogue/company/dropdown/',
    { query: { name }, signal: options?.signal },
  );
}

function mapSellerDropdownRow(raw: Record<string, unknown>): CatalogDropdownRow {
  const id = Number(raw.id);
  const first = String(raw.first_name ?? '').trim();
  const last = String(raw.last_name ?? '').trim();
  const combined = [first, last].filter(Boolean).join(' ').trim();
  const name =
    combined
    || String(raw.name ?? '').trim()
    || String(raw.username ?? '').trim()
    || 'Sin nombre';
  return { id, name };
}

function fetchSellerDropdown(
  name: string,
  options?: { signal?: AbortSignal },
) {
  return $fetch<PaginatedResponse<Record<string, unknown>>>(
    '/api/auth/user/dropdown/',
    { query: { role: 'seller', name }, signal: options?.signal },
  ).then((res) => ({
    next: res.next,
    previous: res.previous,
    results: (res.results ?? []).map(mapSellerDropdownRow),
  }));
}

const queryCache = useQueryCache();

const { mutate, asyncStatus } = useMutation({
  mutation: async ({
    body,
    id,
    credit,
    createCredit,
  }: {
    body: ClientCreateBody;
    id: number | null;
    credit?: ZodInfer<typeof creditFormSchema>;
    createCredit?: boolean;
  }) => {
    if (id != null) {
      await $fetch(`/api/catalogue/client/update/${id}/`, {
        method: 'PUT',
        body,
      });
      if (credit) {
        if (createCredit) {
          await $fetch('/api/credit/create/', {
            method: 'POST',
            body: creditFormToCreateBody(id, credit),
          });
        } else {
          const creditId = editingCreditId.value;
          if (creditId == null) {
            throw new Error('No se encontró el crédito del cliente para actualizar.');
          }
          await $fetch(`/api/credit/update/${creditId}/`, {
            method: 'PUT',
            body: creditFormToCreateBody(id, credit),
          });
        }
        await clientCredit.refresh();
        await clientCreditInvoices.refresh();
        syncCreditFromComposable();
      }
      return;
    }

    const created = await $fetch<{ id: number }>('/api/catalogue/client/create/', {
      method: 'POST',
      body,
    });

    if (body.client_type === 'CREDIT' && credit) {
      try {
        await $fetch('/api/credit/create/', {
          method: 'POST',
          body: creditFormToCreateBody(created.id, credit),
        });
      } catch (error) {
        await queryCache.invalidateQueries({ key: ['clients'] });
        throw new Error(
          `Cliente creado, pero no se pudo registrar el crédito. ${getFetchErrorMessage(error)}`,
        );
      }
    }

    return created;
  },
  async onSuccess() {
    const wasEdit = editingId.value != null;
    toast.add({
      title: wasEdit ? 'Cliente actualizado' : 'Cliente creado',
      color: 'success',
    });
    await queryCache.invalidateQueries({ key: ['clients'] });
    closeWithoutConfirm();
    resetForm();
    editingId.value = null;
  },
  onError: (e) => {
    console.error(e);
    toast.add({
      title: 'No se pudo guardar',
      description: getFetchErrorMessage(e),
      color: 'error',
    });
  },
});

function buildSubmitBody(data: ZodInfer<typeof clientCreateSchema>): ClientCreateBody {
  return {
    ...data,
    company: data.company ?? null,
    seller: data.seller ?? null,
    is_active: data.is_active ?? true,
  };
}

function isCreatingCredit(): boolean {
  return (
    isEdit.value
    && !hasLinkedCredit.value
    && (parseClientMoney(creditState.limit) ?? 0) > 0
  );
}

function needsCreditValidation(data: ZodInfer<typeof clientCreateSchema>): boolean {
  const updatingCredit = isEdit.value && hasLinkedCredit.value;
  const creditOnCreate =
    !isEdit.value
    && data.client_type === 'CREDIT'
    && !companyCreditInherited.value;
  return isCreatingCredit() || updatingCredit || creditOnCreate;
}

function onSubmit(payload: { data: ZodInfer<typeof clientCreateSchema> }) {
  if (!needsCreditValidation(payload.data)) {
    mutate({ body: buildSubmitBody(payload.data), id: editingId.value });
    return;
  }

  if (isEdit.value) {
    const creditResult = creditFormSchema.safeParse(creditState);
    if (!creditResult.success) {
      const issue = creditResult.error.issues[0];
      toast.add({
        title: 'Revisa los datos de crédito',
        description: issue?.message ?? 'Completa los campos de crédito.',
        color: 'error',
      });
      editTab.value = 'credit';
      return;
    }

    let body = buildSubmitBody(payload.data);
    const creatingCredit = isCreatingCredit();
    if (creatingCredit && body.client_type !== 'CREDIT') {
      body = { ...body, client_type: 'CREDIT' };
    }
    mutate({
      body,
      id: editingId.value,
      credit: creditResult.data,
      createCredit: creatingCredit,
    });
    return;
  }

  pendingClientData.value = payload.data;
  void creditFormSectionRef.value?.submit();
}

function onCreditSubmit(
  payload: FormSubmitEvent<ZodInfer<typeof creditFormSchema>>,
) {
  const clientData = pendingClientData.value;
  if (clientData == null) return;
  pendingClientData.value = null;

  let body = buildSubmitBody(clientData);
  const creatingCredit = isCreatingCredit();
  if (creatingCredit && body.client_type !== 'CREDIT') {
    body = { ...body, client_type: 'CREDIT' };
  }

  mutate({
    body,
    id: editingId.value,
    credit: payload.data,
    createCredit: creatingCredit,
  });
}

function onFormError() {
  const result = clientCreateSchema.safeParse(state);
  const issue = result.success ? null : result.error.issues[0];
  toast.add({
    title: 'Revisa el formulario',
    description: issue?.message ?? 'Completa los campos requeridos.',
    color: 'error',
  });
}

function onCreditFormError() {
  const result = creditFormSchema.safeParse(creditState);
  const issue = result.success ? null : result.error.issues[0];
  toast.add({
    title: 'Revisa los datos de crédito',
    description: issue?.message ?? 'Completa los campos de crédito.',
    color: 'error',
  });
  if (isEdit.value) editTab.value = 'credit';
}

function cancel() {
  requestClose();
}

async function requestSubmit() {
  await formRef.value?.submit();
}
</script>

<template>
  <USlideover
    v-model:open="guardedOpen"
    :title="isEdit ? 'Editar cliente' : 'Nuevo cliente'"
    :ui="{
      content: `max-w-xl ${adminListSlideoverContentClass}`,
      body: adminListSlideoverBodyUi.body,
    }"
  >
    <UButton
      icon="i-lucide-plus"
      label="Nuevo cliente"
      size="lg"
      @click="prepareCreate"
    />

    <template #body>
      <div v-if="detailPending && isEdit" class="flex justify-center py-8">
        <UIcon
          name="i-lucide-loader-circle"
          class="size-8 animate-spin text-muted"
        />
      </div>
      <UForm
        v-show="!detailPending || !isEdit"
        ref="formRef"
        :schema="clientCreateSchema"
        :state="state"
        :class="adminListSlideoverScrollClass"
        @submit="onSubmit"
        @error="onFormError"
      >
        <UTabs
          v-if="showEditCreditTabs"
          v-model="editTab"
          :items="editTabItems"
          class="flex w-full flex-col gap-6"
          :ui="slideoverTabsUi"
        >
          <template #general>
            <div class="space-y-8 pt-2">
              <section class="space-y-4">
                <h3
                  class="text-xs font-semibold uppercase tracking-wider text-primary"
                >
                  Datos generales
                </h3>
                <UFormField label="Compañía" name="company">
                  <CatalogDropdownSelect
                    v-model="state.company"
                    v-model:label="state.companyLabel"
                    placeholder="Buscar compañía (opcional)"
                    :fetcher="fetchCompanyDropdown"
                  />
                </UFormField>
                <UFormField label="Nombre" name="name" required>
                  <UInput
                    :model-value="state.name"
                    class="w-full uppercase"
                    @update:model-value="
                      (value) => (state.name = formatCatalogNameInput(value))
                    "
                  />
                </UFormField>
                <UFormField label="Razón social" name="business_name" required>
                  <UInput v-model="state.business_name" class="w-full" />
                </UFormField>
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <UFormField label="RFC" name="rfc" required>
                    <UInput
                      :model-value="state.rfc"
                      class="w-full uppercase"
                      maxlength="13"
                      @update:model-value="
                        (value) => (state.rfc = formatCatalogRfcInput(value))
                      "
                    />
                  </UFormField>
                  <UFormField label="Teléfono" name="phone" required>
                    <UInput
                      :model-value="state.phone"
                      class="w-full"
                      type="tel"
                      inputmode="tel"
                      autocomplete="tel"
                      :placeholder="MEXICO_PHONE_MASK.replaceAll('#', '0')"
                      @update:model-value="
                        (value) => (state.phone = formatMexicoPhoneInput(value))
                      "
                    />
                  </UFormField>
                </div>
                <UFormField label="Email" name="email" required>
                  <UInput v-model="state.email" type="email" class="w-full" />
                </UFormField>
                <UFormField label="Dirección" name="address" required>
                  <UInput v-model="state.address" class="w-full" />
                </UFormField>
              </section>

              <section class="space-y-4">
                <h3
                  class="text-xs font-semibold uppercase tracking-wider text-primary"
                >
                  Configuración comercial
                </h3>
                <UFormField label="Tipo de cliente" name="client_type" required>
                  <USelectMenu
                    v-model="state.client_type"
                    :items="[...CLIENT_TYPE_OPTIONS]"
                    value-key="value"
                    class="w-full"
                    variant="subtle"
                  />
                </UFormField>
                <UFormField label="Modo de facturación" name="billing_type" required>
                  <USelectMenu
                    v-model="state.billing_type"
                    :items="[...BILLING_TYPE_OPTIONS]"
                    value-key="value"
                    class="w-full"
                    variant="subtle"
                  />
                </UFormField>
                <UFormField label="Vendedor asignado" name="seller">
                  <CatalogDropdownSelect
                    v-model="state.seller"
                    v-model:label="state.sellerLabel"
                    placeholder="Buscar vendedor"
                    :fetcher="fetchSellerDropdown"
                  />
                </UFormField>
                <div class="space-y-2">
                  <span class="block text-xs uppercase tracking-wider text-muted">
                    Comisión del vendedor (sobre utilidad)
                  </span>
                  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <UFormField name="commission_type" required>
                      <USelectMenu
                        v-model="state.commission_type"
                        :items="[...COMMISSION_TYPE_OPTIONS]"
                        value-key="value"
                        class="w-full"
                        variant="subtle"
                      />
                    </UFormField>
                    <UFormField name="commission_value" required>
                      <UInputNumber
                        :key="state.commission_type"
                        v-model="commissionValueModel"
                        v-bind="
                          catalogCommissionValueInputProps(state.commission_type)
                        "
                      />
                    </UFormField>
                  </div>
                </div>
                <UFormField
                  label="Comisión fija de vendedor por cotización"
                  name="commission_fixed"
                  required
                  help="Se prorratea entre las partidas de la cotización al asignar el vendedor."
                >
                  <UInputNumber
                    v-model="commissionFixedModel"
                    v-bind="catalogCurrencyInputProps"
                  />
                </UFormField>
                <UFormField
                  label="Multiplicador de precios"
                  name="price_multiplier"
                  required
                >
                  <UInputNumber
                    v-model="priceMultiplierModel"
                    v-bind="catalogNumberInputProps"
                  />
                  <template #help>
                    <span
                      >Precio final = precio base del servicio × multiplicador.</span
                    >
                    <span class="text-primary"> Ej: $1,000 × 1.00 = $1,000</span>
                  </template>
                </UFormField>
                <UFormField
                  label="Multiplicador de préstamo"
                  name="loan_multiplier"
                  required
                >
                  <UInputNumber
                    v-model="loanMultiplierModel"
                    v-bind="catalogNumberInputProps"
                  />
                  <template #help>
                    <span
                      >Precio final en préstamo = precio base × multiplicador de
                      préstamo.</span
                    >
                    <span class="text-primary"> Ej: $1,000 × 1.00 = $1,000</span>
                  </template>
                </UFormField>
              </section>

              <section class="space-y-4">
                <h3
                  class="text-xs font-semibold uppercase tracking-wider text-primary"
                >
                  Notas
                </h3>
                <UFormField label="Observaciones internas" name="notes">
                  <UTextarea v-model="state.notes" class="w-full" :rows="4" />
                </UFormField>
              </section>
            </div>
          </template>

          <template #credit>
            <CatalogClientCreditTabPanel
              v-model:is-active="state.is_active!"
              v-model:credit-state="creditState"
              :client-id="editingId"
              :company-id="state.company ?? null"
              :credit-id="editingCreditId"
              :client-name="state.name"
              :client-type="state.client_type"
              :credit-summary="creditSummary"
              :has-credit-line="hasLinkedCredit"
              v-bind="creditTabInvoiceBindings"
              @load-more-invoices="clientCreditInvoices.loadNextPage()"
              @credit-submit="onCreditSubmit"
              @credit-error="onCreditFormError"
            />
          </template>

          <template #contacts>
            <CatalogClientContactsTabPanel
              v-if="editingId != null"
              :client-id="editingId"
              :enabled="editTab === 'contacts' && clientDetailLoaded"
              :scroll-root-ref="clientSlideoverScrollRoot"
            />
          </template>

          <template #csf>
            <CatalogClientCsfTabPanel
              v-if="editingId != null"
              v-model:csf-url="clientCsfUrl"
              :client-id="editingId"
              @saved="onCsfSaved"
            />
          </template>
        </UTabs>

        <div v-else class="space-y-8">
        <section class="space-y-4">
          <h3
            class="text-xs font-semibold uppercase tracking-wider text-primary"
          >
            Datos generales
          </h3>
          <UFormField label="Compañía" name="company">
            <CatalogDropdownSelect
              v-model="state.company"
              v-model:label="state.companyLabel"
              placeholder="Buscar compañía (opcional)"
              :fetcher="fetchCompanyDropdown"
            />
          </UFormField>
          <UFormField label="Nombre" name="name" required>
            <UInput
              :model-value="state.name"
              class="w-full uppercase"
              @update:model-value="
                (value) => (state.name = formatCatalogNameInput(value))
              "
            />
          </UFormField>
          <UFormField label="Razón social" name="business_name" required>
            <UInput v-model="state.business_name" class="w-full" />
          </UFormField>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <UFormField label="RFC" name="rfc" required>
              <UInput
                :model-value="state.rfc"
                class="w-full uppercase"
                maxlength="13"
                @update:model-value="
                  (value) => (state.rfc = formatCatalogRfcInput(value))
                "
              />
            </UFormField>
            <UFormField label="Teléfono" name="phone" required>
              <UInput
                :model-value="state.phone"
                class="w-full"
                type="tel"
                inputmode="tel"
                autocomplete="tel"
                :placeholder="MEXICO_PHONE_MASK.replaceAll('#', '0')"
                @update:model-value="
                  (value) => (state.phone = formatMexicoPhoneInput(value))
                "
              />
            </UFormField>
          </div>
          <UFormField label="Email" name="email" required>
            <UInput v-model="state.email" type="email" class="w-full" />
          </UFormField>
          <UFormField label="Dirección" name="address" required>
            <UInput v-model="state.address" class="w-full" />
          </UFormField>
        </section>

        <section class="space-y-4">
          <h3
            class="text-xs font-semibold uppercase tracking-wider text-primary"
          >
            Configuración comercial
          </h3>
          <UFormField label="Tipo de cliente" name="client_type" required>
            <USelectMenu
              v-model="state.client_type"
              :items="[...CLIENT_TYPE_OPTIONS]"
              value-key="value"
              class="w-full"
              variant="subtle"
            />
          </UFormField>
          <UFormField label="Modo de facturación" name="billing_type" required>
            <USelectMenu
              v-model="state.billing_type"
              :items="[...BILLING_TYPE_OPTIONS]"
              value-key="value"
              class="w-full"
              variant="subtle"
            />
          </UFormField>
          <UFormField label="Vendedor asignado" name="seller" required>
            <CatalogDropdownSelect
              v-model="state.seller"
              v-model:label="state.sellerLabel"
              placeholder="Buscar vendedor"
              :fetcher="fetchSellerDropdown"
            />
          </UFormField>
          <div class="space-y-2">
            <span class="block text-xs uppercase tracking-wider text-muted">
              Comisión del vendedor (sobre utilidad)
            </span>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <UFormField name="commission_type" required>
                <USelectMenu
                  v-model="state.commission_type"
                  :items="[...COMMISSION_TYPE_OPTIONS]"
                  value-key="value"
                  class="w-full"
                  variant="subtle"
                />
              </UFormField>
              <UFormField name="commission_value" required>
                <UInputNumber
                  :key="state.commission_type"
                  v-model="commissionValueModel"
                  v-bind="
                    catalogCommissionValueInputProps(state.commission_type)
                  "
                />
              </UFormField>
            </div>
          </div>
          <UFormField
            label="Comisión fija de vendedor por cotización"
            name="commission_fixed"
            required
            help="Se prorratea entre las partidas de la cotización al asignar el vendedor."
          >
            <UInputNumber
              v-model="commissionFixedModel"
              v-bind="catalogCurrencyInputProps"
            />
          </UFormField>
          <UFormField label="Multiplicador de precios" name="price_multiplier" required>
            <UInputNumber
              v-model="priceMultiplierModel"
              v-bind="catalogNumberInputProps"
            />
            <template #help>
              <span
                >Precio final = precio base del servicio × multiplicador.</span
              >
              <span class="text-primary"> Ej: $1,000 × 1.00 = $1,000</span>
            </template>
          </UFormField>
          <UFormField label="Multiplicador de préstamo" name="loan_multiplier" required>
            <UInputNumber
              v-model="loanMultiplierModel"
              v-bind="catalogNumberInputProps"
            />
            <template #help>
              <span
                >Precio final en préstamo = precio base × multiplicador de
                préstamo.</span
              >
              <span class="text-primary"> Ej: $1,000 × 1.00 = $1,000</span>
            </template>
          </UFormField>
        </section>

        <CatalogClientCreditFormSection
          v-if="showCreateCreditSection"
          ref="creditFormSectionRef"
          v-model:credit-state="creditState"
          :heading="companyCreditInherited ? 'Crédito de la compañía' : 'Crédito'"
          :readonly="companyCreditInherited"
          :note="
            companyCreditInherited
              ? 'La compañía seleccionada ya tiene línea de crédito. El cliente usará este crédito y no se creará uno propio.'
              : undefined
          "
          @submit="onCreditSubmit"
          @error="onCreditFormError"
        />

        <section class="space-y-4">
          <h3
            class="text-xs font-semibold uppercase tracking-wider text-primary"
          >
            Notas
          </h3>
          <UFormField label="Observaciones internas" name="notes">
            <UTextarea v-model="state.notes" class="w-full" :rows="4" />
          </UFormField>
        </section>
        </div>
      </UForm>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <UButton
          type="button"
          color="neutral"
          variant="subtle"
          label="Cancelar"
          @click="cancel"
        />
        <UButton
          type="button"
          label="Guardar"
          :loading="asyncStatus === 'loading' || (detailPending && isEdit)"
          :disabled="asyncStatus === 'loading' || (detailPending && isEdit)"
          @click="requestSubmit"
        />
      </div>
    </template>
  </USlideover>

  <SharedDiscardChangesConfirmModal
    v-model:open="discardConfirmOpen"
    @confirm="confirmDiscard"
    @cancel="cancelDiscard"
  />
</template>
