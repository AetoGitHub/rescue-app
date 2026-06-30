<script setup lang="ts">
import { useMutation, useQueryCache } from '@pinia/colada';
import type { CompanyCreateBody } from '~/interfaces/catalogs/company';
import type { infer as ZodInfer } from 'zod';
import {
  BILLING_TYPE_OPTIONS,
  CLIENT_TYPE_OPTIONS,
  COMMISSION_TYPE_OPTIONS,
} from '~/constants/catalog-select-options';
import { companyCreateSchema } from '~/schemas/catalog-create';

const toast = useToast();

type CompanyFormState = ZodInfer<typeof companyCreateSchema>;

const open = ref(false);
const editingId = ref<number | null>(null);
const detailPending = ref(false);

const isEdit = computed(() => editingId.value != null);

function emptyState(): CompanyFormState {
  return {
    name: '',
    business_name: '',
    rfc: '',
    phone: '',
    email: '',
    address: '',
    client_type: 'CREDIT',
    billing_type: 'DIRECT_INVOICE',
    commission_type: 'PERCENTAGE',
    commission_value: '0.00',
    commission_fixed: '0.00',
    price_multiplier: '1.00',
  };
}

const state = reactive(emptyState());
const commissionValueModel = useCommissionValueModel(
  toRef(state, 'commission_value'),
  toRef(state, 'commission_type'),
);
const commissionFixedModel = useStringNumberModel(toRef(state, 'commission_fixed'));
const priceMultiplierModel = useStringNumberModel(toRef(state, 'price_multiplier'));

function resetForm() {
  Object.assign(state, emptyState());
}

function prepareCreate() {
  editingId.value = null;
  resetForm();
}

async function loadDetail(id: number) {
  detailPending.value = true;
  try {
    const raw = await $fetch<Record<string, unknown>>(
      `/api/catalogue/company/detail/${id}/`,
    );
    Object.assign(state, mapCompanyDetail(raw));
  } catch (e) {
    console.error(e);
    toast.add({
      title: 'No se pudo cargar la compañía',
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

const queryCache = useQueryCache();

const { mutate, asyncStatus } = useMutation({
  mutation: ({ body, id }: { body: CompanyCreateBody; id: number | null }) =>
    id != null
      ? $fetch(`/api/catalogue/company/update/${id}/`, {
          method: 'PUT',
          body,
        })
      : $fetch('/api/catalogue/company/create/', { method: 'POST', body }),
  async onSuccess() {
    const wasEdit = editingId.value != null;
    toast.add({
      title: wasEdit ? 'Compañía actualizada' : 'Compañía creada',
      color: 'success',
    });
    await queryCache.invalidateQueries({ key: ['companies'] });
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

function onSubmit(payload: { data: CompanyCreateBody }) {
  mutate({ body: payload.data, id: editingId.value });
}

function onFormError() {
  console.error('Validación de formulario de compañía');
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
    :title="isEdit ? 'Editar compañía' : 'Nueva compañía'"
  >
    <UButton
      icon="i-lucide-plus"
      label="Nueva compañía"
      size="lg"
      @click="prepareCreate"
    />

    <template #body>
      <div v-if="detailPending && isEdit" class="flex justify-center py-8">
        <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-muted" />
      </div>
      <UForm
        v-show="!detailPending || !isEdit"
        ref="formRef"
        :schema="companyCreateSchema"
        :state="state"
        class="space-y-4 overflow-y-auto max-h-[calc(100vh-12rem)] pe-1"
        @submit="onSubmit"
        @error="onFormError"
      >
        <UFormField label="Nombre" name="name" required>
          <UInput
            :model-value="state.name"
            class="w-full uppercase"
            @update:model-value="(value) => (state.name = formatCatalogNameInput(value))"
          />
        </UFormField>
        <UFormField label="Razón social" name="business_name" required>
          <UInput v-model="state.business_name" class="w-full" />
        </UFormField>
        <UFormField label="RFC" name="rfc" required>
          <UInput
            :model-value="state.rfc"
            class="w-full uppercase"
            maxlength="13"
            @update:model-value="(value) => (state.rfc = formatCatalogRfcInput(value))"
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
            @update:model-value="(value) => (state.phone = formatMexicoPhoneInput(value))"
          />
        </UFormField>
        <UFormField label="Correo" name="email" required>
          <UInput v-model="state.email" type="email" class="w-full" />
        </UFormField>
        <UFormField label="Dirección" name="address" required>
          <UInput v-model="state.address" class="w-full" />
        </UFormField>
        <UFormField label="Tipo de cliente" name="client_type" required>
          <USelectMenu
            v-model="state.client_type"
            :items="[...CLIENT_TYPE_OPTIONS]"
            value-key="value"
            class="w-full"
            variant="subtle"
          />
        </UFormField>
        <UFormField label="Facturación" name="billing_type" required>
          <USelectMenu
            v-model="state.billing_type"
            :items="[...BILLING_TYPE_OPTIONS]"
            value-key="value"
            class="w-full"
            variant="subtle"
          />
        </UFormField>
        <UFormField label="Tipo de comisión" name="commission_type" required>
          <USelectMenu
            v-model="state.commission_type"
            :items="[...COMMISSION_TYPE_OPTIONS]"
            value-key="value"
            class="w-full"
            variant="subtle"
          />
        </UFormField>
        <UFormField label="Valor comisión" name="commission_value" required>
          <UInputNumber
            :key="state.commission_type"
            v-model="commissionValueModel"
            v-bind="catalogCommissionValueInputProps(state.commission_type)"
          />
        </UFormField>
        <UFormField label="Comisión fija" name="commission_fixed" required>
          <UInputNumber
            v-model="commissionFixedModel"
            v-bind="catalogCurrencyInputProps"
          />
        </UFormField>
        <UFormField label="Multiplicador de precio" name="price_multiplier" required>
          <UInputNumber
            v-model="priceMultiplierModel"
            v-bind="catalogNumberInputProps"
          />
        </UFormField>
      </UForm>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <UButton type="button" color="neutral" variant="subtle" label="Cancelar" @click="cancel" />
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
