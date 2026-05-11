<script setup lang="ts">
import { useMutation, useQueryCache } from '@pinia/colada';
import type { ClientCreateBody } from '~/interfaces/catalogs/client';
import type { CatalogDropdownRow } from '~/interfaces/shared/catalog-dropdown.interface';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';
import {
  BILLING_TYPE_OPTIONS,
  CLIENT_TYPE_OPTIONS,
  COMMISSION_TYPE_OPTIONS,
} from '~/constants/catalog-select-options';
import { clientCreateSchema } from '~/schemas/catalog-create';
import { mapClientDetail } from '~/utils/catalog-detail-map';
import { getFetchErrorMessage } from '~/utils/fetch-error-message';

const toast = useToast();

type ClientFormState = Omit<ClientCreateBody, 'company' | 'seller'> & {
  company?: number;
  seller?: number;
};

const open = ref(false);
const editingId = ref<number | null>(null);
const detailPending = ref(false);

const isEdit = computed(() => editingId.value != null);

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
      `/api/catalogue/client/detail/${id}/`,
    );
    Object.assign(state, emptyState(), mapClientDetail(raw));
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

function setSellerFromInput(v: string | number | undefined) {
  if (v === '' || v === undefined) {
    state.seller = undefined;
  } else {
    state.seller = Number(v);
  }
}

const queryCache = useQueryCache();

const { mutate, asyncStatus } = useMutation({
  mutation: ({ body, id }: { body: ClientCreateBody; id: number | null }) =>
    id != null
      ? $fetch(`/api/catalogue/client/update/${id}/`, {
          method: 'PATCH',
          body,
        })
      : $fetch('/api/catalogue/client/create/', { method: 'POST', body }),
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
    <UButton icon="i-lucide-plus" label="Nuevo cliente" size="lg" @click="prepareCreate" />

    <template #body>
      <div v-if="detailPending && isEdit" class="flex justify-center py-8">
        <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-muted" />
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
          <h3 class="text-xs font-semibold uppercase tracking-wider text-primary">
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
            <UInput v-model="state.name" class="w-full" />
          </UFormField>
          <UFormField label="Razón social" name="business_name">
            <UInput v-model="state.business_name" class="w-full" />
          </UFormField>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <UFormField label="RFC" name="rfc">
              <UInput v-model="state.rfc" class="w-full" />
            </UFormField>
            <UFormField label="Teléfono" name="phone">
              <UInput v-model="state.phone" class="w-full" />
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
          <h3 class="text-xs font-semibold uppercase tracking-wider text-primary">
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
            <UInput
              :model-value="state.seller != null ? String(state.seller) : ''"
              type="number"
              class="w-full"
              placeholder="ID del vendedor"
              @update:model-value="setSellerFromInput"
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
                <UInput v-model="state.commission_value" class="w-full" />
              </UFormField>
            </div>
          </div>
          <UFormField
            label="Comisión fija de vendedor por cotización"
            name="commission_fixed"
            help="Se prorratea entre las partidas de la cotización al asignar el vendedor."
          >
            <UInput v-model="state.commission_fixed" class="w-full" />
          </UFormField>
          <UFormField label="Multiplicador de precios" name="price_multiplier">
            <UInput v-model="state.price_multiplier" class="w-full" />
            <template #help>
              <span>Precio final = precio base del servicio × multiplicador.</span>
              <span class="text-primary"> Ej: $1,000 × 1.00 = $1,000</span>
            </template>
          </UFormField>
        </section>

        <section class="space-y-4">
          <h3 class="text-xs font-semibold uppercase tracking-wider text-primary">
            Notas
          </h3>
          <UFormField label="Observaciones internas" name="notes">
            <textarea
              v-model="state.notes"
              class="w-full min-h-24 rounded-lg border border-default px-3 py-2 text-sm bg-default"
              rows="4"
            />
          </UFormField>
        </section>
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
