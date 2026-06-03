<script setup lang="ts">
import { useMutation, useQueryCache } from '@pinia/colada';
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

const toast = useToast();

type ClientFormState = Omit<
  ZodInfer<typeof clientCreateSchema>,
  'company' | 'seller'
> & {
  company?: number;
  seller?: number;
};

const open = ref(false);
const editingId = ref<number | null>(null);
const editingCreditId = ref<number | null>(null);
const detailPending = ref(false);
const editTab = ref<'general' | 'credit'>('general');

const isEdit = computed(() => editingId.value != null);
const showEditCreditTabs = computed(() => isEdit.value);
const showCreateCreditSection = computed(
  () => !isEdit.value && state.client_type === 'CREDIT',
);
const hasLinkedCredit = computed(() => editingCreditId.value != null);

const editTabItems = [
  { label: 'General', value: 'general', slot: 'general' as const },
  { label: 'Crédito', value: 'credit', slot: 'credit' as const },
];

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
    company: undefined,
    seller: undefined,
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

function resetForm() {
  Object.assign(state, emptyState());
  Object.assign(creditState, emptyCreditState());
  Object.assign(creditSummary, emptyCreditSummary());
  editingCreditId.value = null;
  editTab.value = 'general';
}

function prepareCreate() {
  editingId.value = null;
  resetForm();
}

function applyCreditDetail(raw: Record<string, unknown>) {
  const mapped = mapCreditDetail(raw);
  if (mapped.creditId > 0) {
    editingCreditId.value = mapped.creditId;
  }
  Object.assign(creditState, emptyCreditState(), mapped.form);
  Object.assign(creditSummary, emptyCreditSummary(), mapped.summary);
}

async function loadCreditDetail(creditId: number) {
  const raw = await $fetch<Record<string, unknown>>(
    `/api/credit/detail/${creditId}/`,
  );
  applyCreditDetail(raw);
}

async function loadDetail(id: number) {
  detailPending.value = true;
  editingCreditId.value = null;
  try {
    const raw = await $fetch<Record<string, unknown>>(
      `/api/catalogue/client/detail/${id}/`,
    );
    const mapped = mapClientDetail(raw);
    Object.assign(state, emptyState(), mapped);
    const mappedForm = mapClientCreditForm(raw);
    Object.assign(creditSummary, emptyCreditSummary(), mapClientCreditSummary(raw));

    const creditId =
      resolveCreditId(raw) ??
      (creditSummary.credit_id != null ? creditSummary.credit_id : null);

    if (creditId != null) {
      await loadCreditDetail(creditId);
    } else {
      const hydrated = hydrateClientCreditDisplayWithoutLine(
        String(mapped.client_type ?? 'CASH'),
        creditSummary,
        mappedForm,
      );
      Object.assign(creditSummary, hydrated.summary);
      Object.assign(creditState, hydrated.form);
    }
  } catch (e) {
    console.error(e);
    toast.add({
      title: 'No se pudo cargar el cliente',
      description: getFetchErrorMessage(e),
      color: 'error',
    });
  } finally {
    detailPending.value = false;
  }
}

async function openEdit(id: number) {
  editingId.value = id;
  resetForm();
  open.value = true;
  await loadDetail(id);
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
          const created = await $fetch<Record<string, unknown>>('/api/credit/create/', {
            method: 'POST',
            body: creditFormToCreateBody(id, credit),
          });
          const newCreditId = resolveCreditId(created) ?? Number(created.id);
          if (Number.isFinite(newCreditId) && newCreditId > 0) {
            editingCreditId.value = newCreditId;
            await loadCreditDetail(newCreditId);
          }
        } else {
          const creditId = editingCreditId.value;
          if (creditId == null) {
            throw new Error('No se encontró el crédito del cliente para actualizar.');
          }
          await $fetch(`/api/credit/update/${creditId}/`, {
            method: 'PUT',
            body: creditFormToCreateBody(id, credit),
          });
          await loadCreditDetail(creditId);
        }
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
    open.value = false;
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

const formRef = ref<{ submit: () => Promise<void> } | null>(null);

function buildSubmitBody(data: ZodInfer<typeof clientCreateSchema>): ClientCreateBody {
  return {
    ...data,
    company: data.company ?? null,
    seller: data.seller,
    is_active: data.is_active ?? true,
  };
}

function onSubmit(payload: { data: ZodInfer<typeof clientCreateSchema> }) {
  let body = buildSubmitBody(payload.data);
  const creatingCredit =
    isEdit.value
    && !hasLinkedCredit.value
    && (parseClientMoney(creditState.limit) ?? 0) > 0;
  const updatingCredit = isEdit.value && hasLinkedCredit.value;
  const creditOnCreate = !isEdit.value && body.client_type === 'CREDIT';

  if (creatingCredit || updatingCredit || creditOnCreate) {
    const creditResult = creditFormSchema.safeParse(creditState);
    if (!creditResult.success) {
      const issue = creditResult.error.issues[0];
      toast.add({
        title: 'Revisa los datos de crédito',
        description: issue?.message ?? 'Completa los campos de crédito.',
        color: 'error',
      });
      if (isEdit.value) editTab.value = 'credit';
      return;
    }

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

  mutate({ body, id: editingId.value });
}

function onFormError() {
  console.error('Validación de formulario de cliente');
}

function cancel() {
  open.value = false;
}

async function requestSubmit() {
  await formRef.value?.submit();
}
</script>

<template>
  <USlideover
    v-model:open="open"
    :title="isEdit ? 'Editar cliente' : 'Nuevo cliente'"
    :ui="{ content: 'max-w-xl' }"
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
        class="flex min-h-0 flex-1 flex-col overflow-y-auto max-h-[calc(100vh-12rem)] pe-1"
        @submit="onSubmit"
        @error="onFormError"
      >
        <UTabs
          v-if="showEditCreditTabs"
          v-model="editTab"
          :items="editTabItems"
          class="flex min-h-0 flex-1 flex-col gap-6"
          :ui="{ list: 'shrink-0' }"
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
              :client-name="state.name"
              :client-type="state.client_type"
              :credit-summary="creditSummary"
              :has-credit-line="hasLinkedCredit"
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
        </section>

        <CatalogClientCreditFormSection
          v-if="showCreateCreditSection"
          v-model:credit-state="creditState"
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
</template>
