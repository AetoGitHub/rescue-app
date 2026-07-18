<script setup lang="ts">
import { useMutation, useQueryCache } from '@pinia/colada';
import type { ContractItem } from '~/interfaces/catalogs/contract';
import type { CatalogDropdownRow } from '~/interfaces/shared/catalog-dropdown.interface';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';
import type { infer as ZodInfer } from 'zod';
import {
  contractItemFormSchema,
  contractItemFormToCreateBody,
  contractItemFormToUpdateBody,
} from '~/schemas/catalog-create';
import {
  adminListSlideoverBodyUi,
  adminListSlideoverContentClass,
  adminListSlideoverScrollClass,
} from '~/constants/admin-list-layout';

const props = defineProps<{
  contractId: number;
}>();

const toast = useToast();
const queryCache = useQueryCache();

type ContractItemFormState = {
  service?: number;
  serviceLabel: string;
  price: string;
  price_multiplier: string;
  percentaje: string;
  notes: string;
};

const open = ref(false);
const editingItemId = ref<number | null>(null);

const isEdit = computed(() => editingItemId.value != null);

function emptyState(): ContractItemFormState {
  return {
    service: undefined,
    serviceLabel: '',
    price: '',
    price_multiplier: '',
    percentaje: '',
    notes: '',
  };
}

const state = reactive(emptyState());
const priceModel = useStringNumberModel(toRef(state, 'price'));
const priceMultiplierModel = useStringNumberModel(
  toRef(state, 'price_multiplier'),
);
const percentajeModel = usePercentStringNumberModel(toRef(state, 'percentaje'));
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
  editingItemId.value = null;
  resetForm();
  resetDirtySnapshot();
  open.value = true;
}

function openEdit(item: ContractItem) {
  editingItemId.value = item.id;
  Object.assign(state, emptyState(), {
    service: item.service_id,
    serviceLabel: item.service_name?.trim() ?? '',
    price: item.price,
    price_multiplier: item.price_multiplier,
    percentaje: item.percentaje,
    notes: item.notes,
  });
  resetDirtySnapshot();
  open.value = true;
}

defineExpose({ prepareCreate, openEdit });

watch(open, (value) => {
  if (!value) {
    editingItemId.value = null;
    resetForm();
  }
});

function fetchServiceDropdown(
  name: string,
  options?: { signal?: AbortSignal },
) {
  return $fetch<PaginatedResponse<CatalogDropdownRow>>(
    '/api/catalogue/service/dropdown/',
    { query: { name }, signal: options?.signal },
  );
}

const { mutate, asyncStatus } = useMutation({
  mutation: ({
    body,
    itemId,
  }: {
    body: ReturnType<typeof contractItemFormToCreateBody>;
    itemId: number | null;
  }) =>
    itemId != null
      ? $fetch(`/api/catalogue/contract/item/update/${itemId}/`, {
          method: 'PUT',
          body,
        })
      : $fetch(`/api/catalogue/contract/${props.contractId}/item/create/`, {
          method: 'POST',
          body,
        }),
  async onSuccess() {
    const wasEdit = editingItemId.value != null;
    toast.add({
      title: wasEdit ? 'Convenio actualizado' : 'Convenio creado',
      color: 'success',
    });
    await queryCache.invalidateQueries({
      key: ['contract-items', props.contractId],
    });
    closeWithoutConfirm();
    resetForm();
    editingItemId.value = null;
  },
  onError: (e) => {
    console.error(e);
    toast.add({
      title: 'No se pudo guardar el convenio',
      description: getFetchErrorMessage(e),
      color: 'error',
    });
  },
});

const formRef = ref<{ submit: () => Promise<void> } | null>(null);

function onSubmit(payload: { data: ZodInfer<typeof contractItemFormSchema> }) {
  mutate({
    body: isEdit.value
      ? contractItemFormToUpdateBody(payload.data)
      : contractItemFormToCreateBody(payload.data),
    itemId: editingItemId.value,
  });
}

function onFormError() {
  console.error('Validación de formulario de convenio de contrato');
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
    :title="isEdit ? 'Editar convenio' : 'Nuevo convenio'"
    :ui="{
      content: adminListSlideoverContentClass,
      body: adminListSlideoverBodyUi.body,
    }"
  >
    <template #body>
      <UForm
        ref="formRef"
        :schema="contractItemFormSchema"
        :state="state"
        :class="['space-y-4', adminListSlideoverScrollClass]"
        @submit="onSubmit"
        @error="onFormError"
      >
        <UFormField label="Servicio" name="service" required>
          <CatalogDropdownSelect
            :key="editingItemId ?? 'create'"
            v-model="state.service"
            v-model:label="state.serviceLabel"
            placeholder="Buscar servicio"
            :fetcher="fetchServiceDropdown"
          />
        </UFormField>
        <UFormField label="Precio" name="price" required>
          <UInputNumber
            v-model="priceModel"
            v-bind="catalogCurrencyInputProps"
            placeholder="500.00"
          />
        </UFormField>
        <UFormField label="Multiplicador de precio" name="price_multiplier">
          <UInputNumber
            v-model="priceMultiplierModel"
            v-bind="catalogNumberInputProps"
            placeholder="1.00"
          />
        </UFormField>
        <UFormField label="Porcentaje" name="percentaje">
          <UInputNumber
            v-model="percentajeModel"
            v-bind="catalogPercentInputProps"
            placeholder="0.00"
          />
        </UFormField>
        <UFormField label="Notas" name="notes">
          <UTextarea v-model="state.notes" class="w-full" :rows="3" />
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
