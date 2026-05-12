<script setup lang="ts">
import { useMutation, useQueryCache } from '@pinia/colada';
import type { ServiceCreateBody } from '~/interfaces/catalogs/service';
import type { CatalogDropdownRow } from '~/interfaces/shared/catalog-dropdown.interface';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';
import { serviceCreateSchema } from '~/schemas/catalog-create';

const toast = useToast();

type ServiceFormState = Omit<ServiceCreateBody, 'category'> & {
  category?: number;
};

const open = ref(false);
const editingId = ref<number | null>(null);
const detailPending = ref(false);

const isEdit = computed(() => editingId.value != null);

function emptyState(): ServiceFormState {
  return {
    name: '',
    description: '',
    category: undefined,
    unit: 'service',
    warranty: false,
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
      `/api/catalogue/service/detail/${id}/`,
    );
    Object.assign(state, emptyState(), mapServiceDetail(raw));
  } catch (e) {
    console.error(e);
    toast.add({
      title: 'No se pudo cargar el servicio',
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

function fetchCategoryDropdown(name: string) {
  return $fetch<PaginatedResponse<CatalogDropdownRow>>(
    '/api/catalogue/multipurpose/dropdown/',
    { query: { type: 'service_category', name } },
  );
}

const queryCache = useQueryCache();

const { mutate, asyncStatus } = useMutation({
  mutation: ({ body, id }: { body: ServiceCreateBody; id: number | null }) =>
    id != null
      ? $fetch(`/api/catalogue/service/update/${id}/`, {
          method: 'PATCH',
          body,
        })
      : $fetch('/api/catalogue/service/create/', { method: 'POST', body }),
  async onSuccess() {
    const wasEdit = editingId.value != null;
    toast.add({
      title: wasEdit ? 'Servicio actualizado' : 'Servicio creado',
      color: 'success',
    });
    await queryCache.invalidateQueries({ key: ['services'] });
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

function onSubmit(payload: { data: ServiceCreateBody }) {
  mutate({ body: payload.data, id: editingId.value });
}

function onFormError() {
  console.error('Validación de formulario de servicio');
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
    :title="isEdit ? 'Editar servicio' : 'Nuevo servicio'"
  >
    <UButton icon="i-lucide-plus" label="Nuevo servicio" size="lg" @click="prepareCreate" />

    <template #body>
      <div v-if="detailPending && isEdit" class="flex justify-center py-8">
        <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-muted" />
      </div>
      <UForm
        v-show="!detailPending || !isEdit"
        ref="formRef"
        :schema="serviceCreateSchema"
        :state="state"
        class="space-y-4 overflow-y-auto max-h-[calc(100vh-12rem)] pe-1"
        @submit="onSubmit"
        @error="onFormError"
      >
        <UFormField label="Nombre" name="name">
          <UInput
            :model-value="state.name"
            class="w-full uppercase"
            @update:model-value="(value) => (state.name = formatCatalogNameInput(value))"
          />
        </UFormField>
        <UFormField label="Descripción" name="description">
          <UTextarea v-model="state.description" class="w-full" :rows="4" />
        </UFormField>
        <UFormField label="Categoría" name="category">
          <CatalogDropdownSelect
            v-model="state.category"
            placeholder="Buscar categoría"
            :fetcher="fetchCategoryDropdown"
          />
        </UFormField>
        <UFormField label="Unidad" name="unit">
          <UInput v-model="state.unit" class="w-full" />
        </UFormField>
        <UFormField label="Garantía" name="warranty">
          <label class="flex items-center gap-2 text-sm">
            <input
              v-model="state.warranty"
              type="checkbox"
              class="size-4 rounded border border-default"
            >
            <span>Incluye garantía</span>
          </label>
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
