<script setup lang="ts">
import { useMutation, useQueryCache } from '@pinia/colada';
import type { SupplierCreateBody, SupplierRankingSummary } from '~/interfaces/catalogs/supplier';
import { supplierCreateSchema } from '~/schemas/catalog-create';

const toast = useToast();

const open = ref(false);
const editingId = ref<number | null>(null);
const detailPending = ref(false);
const rankingSummary = ref<SupplierRankingSummary>({ score: 0, rescues_count: 0 });

const isEdit = computed(() => editingId.value != null);

function emptyState(): SupplierCreateBody {
  return {
    name: '',
    description: '',
    phone: '',
    email: '',
    service_type: ['cranes'],
    is_trusted: false,
    notes: '',
    latitude: '',
    longitude: '',
  };
}

const state = reactive(emptyState());

function resetForm() {
  Object.assign(state, emptyState());
  rankingSummary.value = { score: 0, rescues_count: 0 };
}

function prepareCreate() {
  editingId.value = null;
  resetForm();
  open.value = true;
}

async function loadDetail(id: number) {
  detailPending.value = true;
  try {
    const raw = await $fetch<Record<string, unknown>>(
      `/api/supplier/detail/${id}/`,
    );
    Object.assign(state, mapSupplierDetail(raw));
    rankingSummary.value = mapSupplierRankingSummary(raw);
  } catch (e) {
    console.error(e);
    toast.add({
      title: 'No se pudo cargar el proveedor',
      description: getFetchErrorMessage(e),
      color: 'error',
    });
  } finally {
    detailPending.value = false;
    await nextTick();
    mapLayoutKey.value += 1;
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
          method: 'PUT',
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

const isSaving = computed(() => asyncStatus.value === 'loading');
const isDetailLoading = computed(() => detailPending.value && isEdit.value);

const formRef = ref<{ submit: () => Promise<void> } | null>(null);
const mapLayoutKey = ref(0);

watch(open, (isOpen) => {
  if (isOpen && editingId.value == null) {
    nextTick(() => {
      mapLayoutKey.value += 1;
    });
  }
});

function onSubmit(payload: { data: SupplierCreateBody }) {
  mutate({ body: payload.data, id: editingId.value });
}

function onFormError() {
  console.error('Validación de formulario de proveedor');
}

function cancel() {
  open.value = false;
}

async function onReviewSubmitted() {
  const id = editingId.value;
  if (id == null) return;
  await loadDetail(id);
}

async function requestSubmit() {
  await formRef.value?.submit();
}
</script>

<template>
  <UModal
    v-model:open="open"
    :dismissible="false"
    scrollable
    :title="isEdit ? 'Editar proveedor' : 'Nuevo proveedor'"
    :description="
      isEdit
        ? 'Actualiza los datos del operador o grúa.'
        : 'Registra un nuevo operador o grúa.'
    "
    :ui="{ content: 'max-w-3xl' }"
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
      <div v-show="!detailPending || !isEdit" class="space-y-8">
        <UForm
          ref="formRef"
          :schema="supplierCreateSchema"
          :state="state"
          class="space-y-4"
          @submit="onSubmit"
          @error="onFormError"
        >
          <CatalogSupplierFormFields
            v-model:state="state"
            :map-layout-key="mapLayoutKey"
          />
        </UForm>

        <CatalogSupplierRankingSection
          v-if="isEdit && editingId != null"
          :summary="rankingSummary"
          :supplier-id="editingId"
          :loading="detailPending"
          @submitted="onReviewSubmitted"
        />
      </div>
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
          :label="isEdit ? 'Guardar' : 'Crear proveedor'"
          :icon="isSaving ? undefined : 'i-lucide-check'"
          :loading="isSaving"
          :disabled="isSaving || isDetailLoading"
          @click="requestSubmit"
        />
      </div>
    </template>
  </UModal>
</template>
