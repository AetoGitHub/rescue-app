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
import type { CreditFormState } from '~/interfaces/catalogs/credit';
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
const detailPending = ref(false);

const isEdit = computed(() => editingId.value != null);

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
  };
}

const state = reactive(emptyState());
const creditState = reactive(emptyCreditState());
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
const creditLimitModel = useStringNumberModel(toRef(creditState, 'limit'));
const creditDaysModel = useRequiredIntegerModel(toRef(creditState, 'days'));
const creditExtensionModel = useRequiredIntegerModel(
  toRef(creditState, 'extension'),
);
const creditRemisionToleranceModel = useRequiredIntegerModel(
  toRef(creditState, 'remision_tolerance'),
);

function resetForm() {
  Object.assign(state, emptyState());
  Object.assign(creditState, emptyCreditState());
}

function prepareCreate() {
  editingId.value = null;
  resetForm();
}

async function loadDetail(id: number) {
  detailPending.value = true;
  try {
    const raw = await $fetch<Record<string, unknown>>(
      `/api/catalogue/client/detail/${id}/`,
    );
    Object.assign(state, emptyState(), mapClientDetail(raw));
    Object.assign(creditState, emptyCreditState(), mapClientCreditForm(raw));
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

function fetchCompanyDropdown(name: string) {
  return $fetch<PaginatedResponse<CatalogDropdownRow>>(
    '/api/catalogue/company/dropdown/',
    { query: { name } },
  );
}

function fetchSellerDropdown(name: string) {
  return $fetch<PaginatedResponse<CatalogDropdownRow>>(
    '/api/auth/user/dropdown/',
    { query: { role: 'seller', name } },
  );
}

const queryCache = useQueryCache();

const { mutate, asyncStatus } = useMutation({
  mutation: async ({
    body,
    id,
    credit,
  }: {
    body: ClientCreateBody;
    id: number | null;
    credit?: ZodInfer<typeof creditFormSchema>;
  }) => {
    if (id != null) {
      return $fetch(`/api/catalogue/client/update/${id}/`, {
        method: 'PATCH',
        body,
      });
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

function onSubmit(payload: { data: ClientCreateBody }) {
  if (!isEdit.value && payload.data.client_type === 'CREDIT') {
    const creditResult = creditFormSchema.safeParse(creditState);
    if (!creditResult.success) {
      const issue = creditResult.error.issues[0];
      toast.add({
        title: 'Revisa los datos de crédito',
        description: issue?.message ?? 'Completa los campos de crédito.',
        color: 'error',
      });
      return;
    }
    mutate({
      body: payload.data,
      id: editingId.value,
      credit: creditResult.data,
    });
    return;
  }

  mutate({ body: payload.data, id: editingId.value });
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
        class="space-y-8 overflow-y-auto max-h-[calc(100vh-12rem)] pe-1"
        @submit="onSubmit"
        @error="onFormError"
      >
        <section class="space-y-4">
          <h3
            class="text-xs font-semibold uppercase tracking-wider text-primary"
          >
            Datos generales
          </h3>
          <UFormField label="Compañía" name="company">
            <CatalogDropdownSelect
              v-model="state.company"
              placeholder="Buscar compañía"
              :fetcher="fetchCompanyDropdown"
            />
          </UFormField>
          <UFormField label="Nombre" name="name">
            <UInput
              :model-value="state.name"
              class="w-full uppercase"
              @update:model-value="
                (value) => (state.name = formatCatalogNameInput(value))
              "
            />
          </UFormField>
          <UFormField label="Razón social" name="business_name">
            <UInput v-model="state.business_name" class="w-full" />
          </UFormField>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <UFormField label="RFC" name="rfc">
              <UInput
                :model-value="state.rfc"
                class="w-full uppercase"
                maxlength="13"
                @update:model-value="
                  (value) => (state.rfc = formatCatalogRfcInput(value))
                "
              />
            </UFormField>
            <UFormField label="Teléfono" name="phone">
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
          <UFormField label="Email" name="email">
            <UInput v-model="state.email" type="email" class="w-full" />
          </UFormField>
          <UFormField label="Dirección" name="address">
            <UInput v-model="state.address" class="w-full" />
          </UFormField>
        </section>

        <section class="space-y-4">
          <h3
            class="text-xs font-semibold uppercase tracking-wider text-primary"
          >
            Configuración comercial
          </h3>
          <UFormField label="Tipo de cliente" name="client_type">
            <USelectMenu
              v-model="state.client_type"
              :items="[...CLIENT_TYPE_OPTIONS]"
              value-key="value"
              class="w-full"
              variant="subtle"
            />
          </UFormField>
          <UFormField label="Modo de facturación" name="billing_type">
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
              placeholder="Buscar vendedor"
              :fetcher="fetchSellerDropdown"
            />
          </UFormField>
          <div class="space-y-2">
            <span class="block text-xs uppercase tracking-wider text-muted">
              Comisión del vendedor (sobre utilidad)
            </span>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <UFormField name="commission_type">
                <USelectMenu
                  v-model="state.commission_type"
                  :items="[...COMMISSION_TYPE_OPTIONS]"
                  value-key="value"
                  class="w-full"
                  variant="subtle"
                />
              </UFormField>
              <UFormField name="commission_value">
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
            help="Se prorratea entre las partidas de la cotización al asignar el vendedor."
          >
            <UInputNumber
              v-model="commissionFixedModel"
              v-bind="catalogCurrencyInputProps"
            />
          </UFormField>
          <UFormField label="Multiplicador de precios" name="price_multiplier">
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

        <section v-if="state.client_type === 'CREDIT'" class="space-y-4">
          <h3
            class="text-xs font-semibold uppercase tracking-wider text-primary"
          >
            Crédito
          </h3>
          <UFormField label="Límite de crédito">
            <UInputNumber
              v-model="creditLimitModel"
              v-bind="catalogCurrencyInputProps"
            />
          </UFormField>
          <div class="grid grid-cols-1 gap-2">
            <UFormField label="Días de crédito">
              <UInputNumber
                v-model="creditDaysModel"
                v-bind="catalogIntegerInputProps"
              />
            </UFormField>
            <UFormField label="Prórroga (días)">
              <UInputNumber
                v-model="creditExtensionModel"
                v-bind="catalogIntegerInputProps"
              />
            </UFormField>
            <UFormField label="Tolerancia remisión (días)">
              <UInputNumber
                v-model="creditRemisionToleranceModel"
                v-bind="catalogIntegerInputProps"
              />
            </UFormField>
          </div>
          <UFormField name="requires_purchase_order">
            <UCheckbox
              v-model="creditState.requires_purchase_order"
              label="El cliente requiere orden de compra"
            />
          </UFormField>
          <UFormField name="is_blocked">
            <UCheckbox
              v-model="creditState.is_blocked"
              label="Bloquear crédito del cliente"
            />
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
