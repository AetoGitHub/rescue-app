<script setup lang="ts">
import { useMutation, useQueryCache } from '@pinia/colada';
import type { FormSubmitEvent } from '@nuxt/ui';
import type { CompanyCreateBody } from '~/interfaces/catalogs/company';
import type { CreditFormState } from '~/interfaces/catalogs/credit';
import type { infer as ZodInfer } from 'zod';
import {
  BILLING_TYPE_OPTIONS,
  CLIENT_TYPE_OPTIONS,
  COMMISSION_TYPE_OPTIONS,
} from '~/constants/catalog-select-options';
import {
  companyCreateSchema,
  creditFormSchema,
  creditFormToCompanyCreateBody,
} from '~/schemas/catalog-create';
import {
  companyCreditCreatePath,
  companyCreditUpdatePath,
} from '~/constants/client-credit-api';
import {
  adminListSlideoverBodyUi,
  adminListSlideoverContentClass,
  adminListSlideoverScrollClass,
} from '~/constants/admin-list-layout';

const toast = useToast();

type CompanyFormState = ZodInfer<typeof companyCreateSchema>;

const open = ref(false);
const editingId = ref<number | null>(null);
const editingCreditId = ref<number | null>(null);
const detailPending = ref(false);
const detailLoaded = ref(false);

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

const state = reactive(emptyState());
const creditState = reactive(emptyCreditState());
const commissionValueModel = useCommissionValueModel(
  toRef(state, 'commission_value'),
  toRef(state, 'commission_type'),
);
const commissionFixedModel = useStringNumberModel(toRef(state, 'commission_fixed'));
const priceMultiplierModel = useStringNumberModel(toRef(state, 'price_multiplier'));

const hasLinkedCredit = computed(() => editingCreditId.value != null);
const showCreditSection = computed(
  () =>
    (!isEdit.value && state.client_type === 'CREDIT')
    || (isEdit.value && (hasLinkedCredit.value || state.client_type === 'CREDIT')),
);

const companyCredit = useCompanyCredit({
  companyId: computed(() => editingId.value),
  enabled: computed(
    () => isEdit.value && editingId.value != null && detailLoaded.value,
  ),
});

function syncCreditFromComposable() {
  const view = companyCredit.view.value;
  if (!view) return;
  editingCreditId.value = view.creditId;
  if (view.creditId != null) {
    Object.assign(creditState, view.form);
  }
}

watch(
  () => companyCredit.view.value,
  () => {
    syncCreditFromComposable();
  },
);

const pendingDetail = computed(
  () =>
    detailPending.value
    || (isEdit.value && detailLoaded.value && companyCredit.isPending.value),
);

function resetForm() {
  Object.assign(state, emptyState());
  Object.assign(creditState, emptyCreditState());
  editingCreditId.value = null;
  detailLoaded.value = false;
  pendingCompanyData.value = null;
}

function prepareCreate() {
  editingId.value = null;
  resetForm();
}

async function loadDetail(id: number) {
  detailPending.value = true;
  detailLoaded.value = false;
  editingCreditId.value = null;
  try {
    const raw = await $fetch<Record<string, unknown>>(
      `/api/catalogue/company/detail/${id}/`,
    );
    Object.assign(state, mapCompanyDetail(raw));
    detailLoaded.value = true;
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
  mutation: async ({
    body,
    id,
    credit,
    createCredit,
  }: {
    body: CompanyCreateBody;
    id: number | null;
    credit?: ZodInfer<typeof creditFormSchema>;
    createCredit?: boolean;
  }) => {
    if (id != null) {
      await $fetch(`/api/catalogue/company/update/${id}/`, {
        method: 'PUT',
        body,
      });
      if (credit) {
        if (createCredit) {
          await $fetch(companyCreditCreatePath(), {
            method: 'POST',
            body: creditFormToCompanyCreateBody(id, credit),
          });
        } else {
          const creditId = editingCreditId.value;
          if (creditId == null) {
            throw new Error(
              'No se encontró el crédito de la compañía para actualizar.',
            );
          }
          await $fetch(companyCreditUpdatePath(creditId), {
            method: 'PUT',
            body: creditFormToCompanyCreateBody(id, credit),
          });
        }
        await companyCredit.refresh();
        syncCreditFromComposable();
      }
      return;
    }

    const created = await $fetch<{ id: number }>(
      '/api/catalogue/company/create/',
      { method: 'POST', body },
    );

    if (body.client_type === 'CREDIT' && credit) {
      try {
        await $fetch(companyCreditCreatePath(), {
          method: 'POST',
          body: creditFormToCompanyCreateBody(created.id, credit),
        });
      } catch (error) {
        await queryCache.invalidateQueries({ key: ['companies'] });
        throw new Error(
          `Compañía creada, pero no se pudo registrar el crédito. ${getFetchErrorMessage(error)}`,
        );
      }
    }

    return created;
  },
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
const creditFormSectionRef = ref<{ submit: () => Promise<void> } | null>(null);
const pendingCompanyData = ref<CompanyCreateBody | null>(null);

function isCreatingCredit(): boolean {
  return (
    isEdit.value
    && !hasLinkedCredit.value
    && showCreditSection.value
    && (parseClientMoney(creditState.limit) ?? 0) > 0
  );
}

function needsCreditValidation(data: CompanyCreateBody): boolean {
  const updatingCredit = isEdit.value && hasLinkedCredit.value;
  const creditOnCreate = !isEdit.value && data.client_type === 'CREDIT';
  return isCreatingCredit() || updatingCredit || creditOnCreate;
}

function onSubmit(payload: { data: CompanyCreateBody }) {
  if (!needsCreditValidation(payload.data)) {
    mutate({ body: payload.data, id: editingId.value });
    return;
  }

  pendingCompanyData.value = payload.data;
  void creditFormSectionRef.value?.submit();
}

function onCreditSubmit(
  payload: FormSubmitEvent<ZodInfer<typeof creditFormSchema>>,
) {
  const companyData = pendingCompanyData.value;
  if (companyData == null) return;
  pendingCompanyData.value = null;

  let body = companyData;
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
  const result = companyCreateSchema.safeParse(state);
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
    :ui="{
      content: adminListSlideoverContentClass,
      body: adminListSlideoverBodyUi.body,
    }"
  >
    <UButton
      icon="i-lucide-plus"
      label="Nueva compañía"
      size="lg"
      @click="prepareCreate"
    />

    <template #body>
      <div v-if="pendingDetail && isEdit" class="flex justify-center py-8">
        <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-muted" />
      </div>
      <UForm
        v-show="!pendingDetail || !isEdit"
        ref="formRef"
        :schema="companyCreateSchema"
        :state="state"
        :class="['space-y-4', adminListSlideoverScrollClass]"
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

        <CatalogClientCreditFormSection
          v-if="showCreditSection"
          ref="creditFormSectionRef"
          v-model:credit-state="creditState"
          requires-purchase-order-label="La compañía requiere orden de compra"
          block-label="Bloquear crédito de la compañía"
          @submit="onCreditSubmit"
          @error="onCreditFormError"
        />
      </UForm>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <UButton type="button" color="neutral" variant="subtle" label="Cancelar" @click="cancel" />
        <UButton
          type="button"
          label="Guardar"
          :loading="asyncStatus === 'loading' || (pendingDetail && isEdit)"
          :disabled="asyncStatus === 'loading' || (pendingDetail && isEdit)"
          @click="requestSubmit"
        />
      </div>
    </template>
  </USlideover>
</template>
