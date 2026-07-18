<script setup lang="ts">
import { useMutation, useQuery, useQueryCache } from '@pinia/colada';
import { SERVICE_UNIT_OPTIONS } from '~/constants/catalog-select-options';
import type { AlegraItemDisplay } from '~/interfaces/alegra/item.interface';
import type { ServiceCreateBody, ServiceUpdateBody } from '~/interfaces/catalogs/service';
import type { CatalogDropdownRow } from '~/interfaces/shared/catalog-dropdown.interface';
import {
  catalogDropdownSelection,
  emptyCatalogDropdownSelection,
  type CatalogDropdownSelection,
} from '~/interfaces/shared/catalog-dropdown.interface';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';
import {
  adminListSlideoverBodyUi,
  adminListSlideoverContentClass,
  adminListSlideoverScrollClass,
} from '~/constants/admin-list-layout';
import { serviceCreateSchema, serviceUpdateSchema } from '~/schemas/catalog-create';

const toast = useToast();
const apiFetch = useApiFetch();

type ServiceFormState = {
  name: string;
  description: string;
  category: CatalogDropdownSelection;
  unit: ServiceCreateBody['unit'];
  warranty: boolean;
  alegra_id: CatalogDropdownSelection;
};

const open = ref(false);
const editingId = ref<number | null>(null);
const detailPending = ref(false);
const linkedAlegraId = ref<number | null>(null);

const isEdit = computed(() => editingId.value != null);

const activeSchema = computed(() =>
  isEdit.value ? serviceUpdateSchema : serviceCreateSchema,
);

function emptyState(): ServiceFormState {
  return {
    name: '',
    description: '',
    category: emptyCatalogDropdownSelection(),
    unit: 'service',
    warranty: false,
    alegra_id: emptyCatalogDropdownSelection(),
  };
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
  snapshot: () => ({ state, linkedAlegraId: linkedAlegraId.value }),
});

function resetForm() {
  Object.assign(state, emptyState());
  linkedAlegraId.value = null;
}

function prepareCreate() {
  editingId.value = null;
  resetForm();
  resetDirtySnapshot();
}

async function loadDetail(id: number) {
  detailPending.value = true;
  try {
    const raw = await $fetch<Record<string, unknown>>(
      `/api/catalogue/service/detail/${id}/`,
    );
    const detail = mapServiceDetailApi(raw);
    const mapped = mapServiceDetail(raw);
    linkedAlegraId.value = detail.alegra_id;
    Object.assign(state, emptyState(), {
      name: mapped.name,
      description: mapped.description,
      unit: mapped.unit,
      warranty: mapped.warranty,
      category: catalogDropdownSelection(
        detail.category_id > 0 ? detail.category_id : null,
        detail.category_name.trim(),
      ),
    });
  } catch (e) {
    console.error(e);
    toast.add({
      title: 'No se pudo cargar el servicio',
      description: getFetchErrorMessage(e),
      color: 'error',
    });
  } finally {
    detailPending.value = false;
    resetDirtySnapshot();
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

function fetchCategoryDropdown(
  name: string,
  options?: { signal?: AbortSignal },
) {
  return $fetch<PaginatedResponse<CatalogDropdownRow>>(
    '/api/catalogue/multipurpose/dropdown/',
    { query: { type: 'service_category', name }, signal: options?.signal },
  );
}

function fetchAlegraItemsDropdown(
  name: string,
  options?: { signal?: AbortSignal; start?: string | null },
) {
  const start = options?.start?.trim();
  return apiFetch<PaginatedResponse<CatalogDropdownRow>>('/api/alegra/items', {
    query: {
      name: name.trim() || undefined,
      start: start || undefined,
    },
    signal: options?.signal,
  });
}

const {
  data: alegraItemDetail,
  asyncStatus: alegraDetailStatus,
  error: alegraDetailError,
} = useQuery({
  key: () => ['alegra-item-detail', linkedAlegraId.value],
  query: ({ signal }) =>
    apiFetch<AlegraItemDisplay>(`/api/alegra/items/${linkedAlegraId.value}`, {
      signal,
    }),
  enabled: () => isEdit.value && linkedAlegraId.value != null,
  refetchOnWindowFocus: false,
});

const alegraDetailErrorMessage = computed(() =>
  alegraDetailError.value != null
    ? getFetchErrorMessage(alegraDetailError.value)
    : '',
);

const queryCache = useQueryCache();

const { mutate, asyncStatus } = useMutation({
  mutation: ({
    body,
    id,
  }: {
    body: ServiceCreateBody | ServiceUpdateBody;
    id: number | null;
  }) =>
    id != null
      ? $fetch(`/api/catalogue/service/update/${id}/`, {
          method: 'PUT',
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

function onSubmit(payload: { data: ServiceFormState }) {
  if (isEdit.value) {
    mutate({
      body: {
        name: payload.data.name,
        description: payload.data.description,
        category: payload.data.category.value!,
        unit: payload.data.unit,
        warranty: payload.data.warranty,
      },
      id: editingId.value,
    });
    return;
  }

  mutate({
    body: {
      name: payload.data.name,
      description: payload.data.description,
      category: payload.data.category.value!,
      unit: payload.data.unit,
      warranty: payload.data.warranty,
      alegra_id: payload.data.alegra_id.value!,
    },
    id: editingId.value,
  });
}

function onFormError() {
  console.error('Validación de formulario de servicio');
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
    :title="isEdit ? 'Editar servicio' : 'Nuevo servicio'"
    :ui="{
      content: adminListSlideoverContentClass,
      body: adminListSlideoverBodyUi.body,
    }"
  >
    <UButton icon="i-lucide-plus" label="Nuevo servicio" size="lg" @click="prepareCreate" />

    <template #body>
      <div v-if="detailPending && isEdit" class="flex justify-center py-8">
        <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-muted" />
      </div>
      <UForm
        v-show="!detailPending || !isEdit"
        ref="formRef"
        :schema="activeSchema"
        :state="state"
        :class="['space-y-4', adminListSlideoverScrollClass]"
        @submit="onSubmit"
        @error="onFormError"
      >
        <UFormField label="Nombre" name="name" required>
          <UInput
            :model-value="state.name"
            class="w-full uppercase"
            maxlength="200"
            @update:model-value="(value) => (state.name = formatCatalogNameInput(value))"
          />
        </UFormField>
        <UFormField label="Categoría" name="category" required>
          <CatalogDropdownSelect
            v-model="state.category"
            placeholder="Buscar categoría"
            :fetcher="fetchCategoryDropdown"
          />
        </UFormField>

        <UFormField
          v-if="!isEdit"
          label="Ítem Alegra"
          name="alegra_id"
          required
        >
          <CatalogDropdownSelect
            v-model="state.alegra_id"
            placeholder="Buscar ítem en Alegra..."
            :fetcher="fetchAlegraItemsDropdown"
            infinite="offset"
          />
        </UFormField>

        <div v-else class="space-y-2">
          <span class="block text-sm font-medium text-default">Ítem Alegra</span>
          <div
            v-if="linkedAlegraId == null"
            class="rounded-lg border border-dashed border-default px-3 py-2 text-sm text-muted"
          >
            Sin vínculo Alegra
          </div>
          <div
            v-else-if="alegraDetailStatus === 'loading'"
            class="flex items-center gap-2 rounded-lg border border-default px-3 py-2 text-sm text-muted"
          >
            <UIcon name="i-lucide-loader-circle" class="size-4 animate-spin" />
            Cargando ítem de Alegra...
          </div>
          <p
            v-else-if="alegraDetailErrorMessage"
            class="rounded-lg border border-error/30 bg-error/5 px-3 py-2 text-sm text-error"
            role="alert"
          >
            {{ alegraDetailErrorMessage }}
          </p>
          <div
            v-else-if="alegraItemDetail"
            class="rounded-lg border border-default px-3 py-2 text-sm"
          >
            <p class="font-medium break-all">{{ alegraItemDetail.name }}</p>
            <p
              v-if="alegraItemDetail.reference"
              class="mt-1 text-xs text-muted break-all"
            >
              Ref: {{ alegraItemDetail.reference }}
            </p>
          </div>
        </div>

        <UFormField label="Unidad" name="unit" required>
          <USelectMenu
            v-model="state.unit"
            :items="[...SERVICE_UNIT_OPTIONS]"
            value-key="value"
            class="w-full"
            variant="subtle"
          />
        </UFormField>
        <UFormField name="warranty">
          <UCheckbox v-model="state.warranty" label="Incluye garantía" />
        </UFormField>
        <UFormField label="Descripción" name="description">
          <UTextarea v-model="state.description" class="w-full" :rows="4" />
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

  <SharedDiscardChangesConfirmModal
    v-model:open="discardConfirmOpen"
    @confirm="confirmDiscard"
    @cancel="cancelDiscard"
  />
</template>
