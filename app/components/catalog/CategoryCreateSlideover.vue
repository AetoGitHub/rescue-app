<script setup lang="ts">
import { useMutation, useQueryCache } from '@pinia/colada';
import type { MultipurposeCatalogueType } from '~/constants/multipurpose-catalog';
import type {
  CategoryCreateBody,
  CategoryUpdateBody,
} from '~/interfaces/catalogs/category';
import { categoryCreateSchema } from '~/schemas/catalog-create';

const props = withDefaults(
  defineProps<{
    showTrigger?: boolean;
    catalogueType?: MultipurposeCatalogueType;
    createTitle?: string;
    editTitle?: string;
    newItemLabel?: string;
    successCreateLabel?: string;
    successEditLabel?: string;
    namePlaceholder?: string;
  }>(),
  {
    showTrigger: true,
    catalogueType: 'service_category',
    createTitle: 'Nueva categoría',
    editTitle: 'Editar categoría',
    newItemLabel: 'Nueva categoría',
    successCreateLabel: 'Categoría creada',
    successEditLabel: 'Categoría actualizada',
    namePlaceholder: 'Ej. Grúas',
  },
);

const toast = useToast();

const open = ref(false);
const editingId = ref<number | null>(null);

const isEdit = computed(() => editingId.value != null);

const slideoverTitle = computed(() =>
  isEdit.value ? props.editTitle : props.createTitle,
);

function emptyState() {
  return { name: '' };
}

const state = reactive(emptyState());
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
  snapshot: () => state,
});

function resetForm() {
  Object.assign(state, emptyState());
}

function prepareCreate() {
  editingId.value = null;
  resetForm();
  resetDirtySnapshot();
  open.value = true;
}

function openEdit(id: number, name: string) {
  editingId.value = id;
  resetForm();
  state.name = normalizeCatalogName(name);
  resetDirtySnapshot();
  open.value = true;
}

defineExpose({ prepareCreate, openEdit });

watch(open, (v) => {
  if (!v) {
    editingId.value = null;
    resetForm();
  }
});

const queryCache = useQueryCache();

const { mutate, asyncStatus } = useMutation({
  mutation: ({
    body,
    id,
  }: {
    body: CategoryCreateBody | CategoryUpdateBody;
    id: number | null;
  }) =>
    id != null
      ? $fetch(`/api/catalogue/multipurpose/update/${id}/`, {
          method: 'PUT',
          body: body as CategoryUpdateBody,
        })
      : $fetch('/api/catalogue/multipurpose/create/', {
          method: 'POST',
          body: body as CategoryCreateBody,
        }),
  async onSuccess() {
    const wasEdit = editingId.value != null;
    toast.add({
      title: wasEdit ? props.successEditLabel : props.successCreateLabel,
      color: 'success',
    });
    await queryCache.invalidateQueries({
      key: ['catalog-multipurpose', props.catalogueType],
    });
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

const formRef = ref<{ submit: () => Promise<void> } | null>(null);

function onSubmit(payload: { data: { name: string } }) {
  if (editingId.value != null) {
    const body: CategoryUpdateBody = {
      name: payload.data.name,
    };
    mutate({ body, id: editingId.value });
    return;
  }

  const body: CategoryCreateBody = {
    catalogue_type: props.catalogueType,
    name: payload.data.name,
  };
  mutate({ body, id: null });
}

function onFormError() {
  console.error('Validación de formulario de categoría');
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
    :title="slideoverTitle"
  >
    <UButton
      v-if="showTrigger"
      icon="i-lucide-plus"
      :label="newItemLabel"
      size="lg"
      @click="prepareCreate"
    />

    <template #body>
      <UForm
        ref="formRef"
        :schema="categoryCreateSchema"
        :state="state"
        @submit="onSubmit"
        @error="onFormError"
      >
        <UFormField label="Nombre" name="name" required>
          <UInput
            :model-value="state.name"
            class="w-full uppercase"
            :placeholder="namePlaceholder"
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
          :loading="asyncStatus === 'loading'"
          :disabled="asyncStatus === 'loading'"
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
