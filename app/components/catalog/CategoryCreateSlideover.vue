<script setup lang="ts">
import { useMutation, useQueryCache } from '@pinia/colada';
import type { CategoryCreateBody } from '~/interfaces/catalogs/category';
import { categoryCreateSchema } from '~/schemas/catalog-create';

const toast = useToast();

const open = ref(false);
const editingId = ref<number | null>(null);
const detailPending = ref(false);

const isEdit = computed(() => editingId.value != null);

function emptyState() {
  return { name: '' };
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
      `/api/catalogue/multipurpose/detail/${id}/`,
    );
    Object.assign(state, emptyState(), mapCategoryDetail(raw));
  } catch (e) {
    console.error(e);
    toast.add({
      title: 'No se pudo cargar la categoría',
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
  mutation: ({ body, id }: { body: CategoryCreateBody; id: number | null }) =>
    id != null
      ? $fetch(`/api/catalogue/multipurpose/update/${id}/`, {
          method: 'PATCH',
          body,
        })
      : $fetch('/api/catalogue/multipurpose/create/', { method: 'POST', body }),
  async onSuccess() {
    const wasEdit = editingId.value != null;
    toast.add({
      title: wasEdit ? 'Categoría actualizada' : 'Categoría creada',
      color: 'success',
    });
    await queryCache.invalidateQueries({ key: ['catalog-categories'] });
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

function onSubmit(payload: { data: { name: string } }) {
  const body: CategoryCreateBody = {
    catalogue_type: 'service_category',
    name: payload.data.name,
  };
  mutate({ body, id: editingId.value });
}

function onFormError() {
  console.error('Validación de formulario de categoría');
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
    :title="isEdit ? 'Editar categoría' : 'Nueva categoría'"
  >
    <UButton icon="i-lucide-plus" label="Nueva categoría" size="lg" @click="prepareCreate" />

    <template #body>
      <div v-if="detailPending && isEdit" class="flex justify-center py-8">
        <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-muted" />
      </div>
      <UForm
        v-show="!detailPending || !isEdit"
        ref="formRef"
        :schema="categoryCreateSchema"
        :state="state"
        @submit="onSubmit"
        @error="onFormError"
      >
        <UFormField label="Nombre" name="name">
          <UInput
            :model-value="state.name"
            class="w-full uppercase"
            placeholder="Ej. Grúas"
            @update:model-value="(value) => (state.name = formatCatalogNameInput(value))"
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
