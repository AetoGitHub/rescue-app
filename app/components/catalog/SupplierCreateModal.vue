<script setup lang="ts">
import { useMutation, useQueryCache } from '@pinia/colada';
import type { SupplierCreateBody } from '~/interfaces/catalogs/supplier';
import { SUPPLIER_SERVICE_TYPE_OPTIONS } from '~/constants/catalog-select-options';
import { supplierCreateSchema } from '~/schemas/catalog-create';

const toast = useToast();

const open = ref(false);
const editingId = ref<number | null>(null);
const detailPending = ref(false);

const isEdit = computed(() => editingId.value != null);
const requestInitialLocation = computed(() => open.value && !isEdit.value);

function emptyState(): SupplierCreateBody {
  return {
    name: '',
    description: '',
    phone: '',
    email: '',
    service_type: 'cranes',
    is_trusted: false,
    notes: '',
    latitude: '',
    longitude: '',
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
      `/api/supplier/detail/${id}/`,
    );
    Object.assign(state, mapSupplierDetail(raw));
  } catch (e) {
    console.error(e);
    toast.add({
      title: 'No se pudo cargar el proveedor',
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
  mutation: ({ body, id }: { body: SupplierCreateBody; id: number | null }) =>
    id != null
      ? $fetch(`/api/supplier/update/${id}/`, {
          method: 'PATCH',
          body,
        })
      : $fetch('/api/supplier/create/', { method: 'POST', body }),
  async onSuccess() {
    const wasEdit = editingId.value != null;
    toast.add({
      title: wasEdit ? 'Proveedor actualizado' : 'Proveedor creado',
      color: 'success',
    });
    await queryCache.invalidateQueries({ key: ['suppliers'] });
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

function onSubmit(payload: { data: SupplierCreateBody }) {
  mutate({ body: payload.data, id: editingId.value });
}

function onFormError() {
  console.error('Validación de formulario de proveedor');
}

function cancel() {
  open.value = false;
}

async function requestSubmit() {
  await formRef.value?.submit();
}
</script>

<template>
  <UModal
    v-model:open="open"
    scrollable
    :title="isEdit ? 'Editar proveedor' : 'Nuevo proveedor'"
    :ui="{ content: 'max-w-2xl' }"
  >
    <UButton
      icon="i-lucide-plus"
      label="Nuevo proveedor"
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
        :schema="supplierCreateSchema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
        @error="onFormError"
      >
        <UFormField label="Nombre" name="name">
          <UInput
            :model-value="state.name"
            class="w-full uppercase"
            @update:model-value="
              (value) => (state.name = formatCatalogNameInput(value))
            "
          />
        </UFormField>
        <UFormField label="Descripción" name="description">
          <textarea
            v-model="state.description"
            class="w-full min-h-24 rounded-lg border border-default px-3 py-2 text-sm bg-default"
            rows="4"
          />
        </UFormField>
        <UFormField label="Teléfono" name="phone">
          <UInput v-model="state.phone" class="w-full" />
        </UFormField>
        <UFormField label="Correo" name="email">
          <UInput v-model="state.email" type="email" class="w-full" />
        </UFormField>
        <UFormField label="Tipo de servicio" name="service_type">
          <USelectMenu
            v-model="state.service_type"
            :items="[...SUPPLIER_SERVICE_TYPE_OPTIONS]"
            value-key="value"
            class="w-full"
            variant="subtle"
          />
        </UFormField>
        <UFormField label="Confiable" name="is_trusted">
          <label class="flex items-center gap-2 text-sm">
            <UCheckbox
              v-model="state.is_trusted"
              type="checkbox"
              class="size-4 rounded border border-default"
            />
            <span>Proveedor confiable</span>
          </label>
        </UFormField>
        <UFormField label="Notas" name="notes">
          <textarea
            v-model="state.notes"
            class="w-full min-h-24 rounded-lg border border-default px-3 py-2 text-sm bg-default"
            rows="3"
          />
        </UFormField>
        <UFormField label="Ubicación" name="latitude">
          <SharedMapPinPicker
            v-model:latitude="state.latitude"
            v-model:longitude="state.longitude"
            :request-initial-location="requestInitialLocation"
          />
        </UFormField>
        <UFormField name="longitude" class="sr-only">
          <input
            v-model="state.longitude"
            type="hidden"
            tabindex="-1"
            aria-hidden="true"
          />
        </UFormField>
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
  </UModal>
</template>
