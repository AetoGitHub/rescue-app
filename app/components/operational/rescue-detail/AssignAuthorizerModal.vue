<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui';
import type { z } from 'zod';
import type { CatalogDropdownFetcher } from '~/composables/useCatalogDropdown';
import { CLIENT_AUTHORIZERS_DROPDOWN_PATH } from '~/constants/client-api';
import type { CatalogDropdownRow } from '~/interfaces/shared/catalog-dropdown.interface';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';
import {
  rescueAuthorizerAssignSchema,
  rescueAuthorizerAssignToBody,
  rescueAuthorizerContactCreateSchema,
  rescueAuthorizerContactCreateToBody,
  type RescueAuthorizerAssignFormState,
  type RescueAuthorizerContactCreateFormState,
} from '~/schemas/rescue-authorizer-assign';

const open = defineModel<boolean>('open', { required: true });

const props = defineProps<{
  rescueId: number;
  clientId: number;
  currentAuthorizerId: number | null;
  currentAuthorizerName: string | null;
  loading?: boolean;
}>();

const emit = defineEmits<{
  saved: [];
}>();

const toast = useToast();
const formRef = ref<{ submit: () => Promise<void> } | null>(null);
const createFormRef = ref<{ submit: () => Promise<void> } | null>(null);
const showCreateForm = ref(false);
const createdRowsById = ref<Map<number, CatalogDropdownRow>>(new Map());

const state = reactive<RescueAuthorizerAssignFormState>({});
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
  snapshot: () => ({ authorizer: state.authorizer ?? null }),
});

const apiFetch = useApiFetch();

const fetchAuthorizersDropdown: CatalogDropdownFetcher = async (
  name,
  options,
) => {
  const res = await apiFetch<{
    count?: number;
    results?: CatalogDropdownRow[];
  } & Partial<PaginatedResponse<CatalogDropdownRow>>>(
    CLIENT_AUTHORIZERS_DROPDOWN_PATH(props.clientId),
    {
      query: name.trim() ? { name: name.trim() } : undefined,
      signal: options?.signal,
    },
  );

  return {
    next: res.next ?? null,
    previous: res.previous ?? null,
    results: res.results ?? [],
  };
};

const { searchTerm, items, loading: dropdownLoading } = useCatalogDropdown(
  fetchAuthorizersDropdown,
);

const displayItems = computed((): CatalogDropdownRow[] => {
  const list = items.value;
  if (state.authorizer == null || list.some((row) => row.id === state.authorizer)) {
    return list;
  }
  const fromCurrent
    = state.authorizer === props.currentAuthorizerId
      ? { id: state.authorizer, name: props.currentAuthorizerName?.trim() || `Contacto #${state.authorizer}` }
      : createdRowsById.value.get(state.authorizer);
  return fromCurrent ? [fromCurrent, ...list] : list;
});

const isEmpty = computed(
  () => !dropdownLoading.value && items.value.length === 0 && searchTerm.value.trim() === '',
);

const { saveAuthorizer, isAssigning } = useRescueAuthorizerAssign(
  () => props.rescueId,
);

const { createContactAsync, isSaving: isCreatingContact } = useClientContactMutations({
  clientId: () => props.clientId,
});

const modalTitle = computed(() =>
  props.currentAuthorizerId != null
    ? 'Cambiar autorizador'
    : 'Asignar autorizador',
);

const isBusy = computed(
  () => props.loading || isAssigning.value || isCreatingContact.value,
);

watch(open, (isOpen) => {
  if (isOpen) {
    state.authorizer = props.currentAuthorizerId ?? undefined;
    resetDirtySnapshot();
    searchTerm.value = '';
    showCreateForm.value = false;
    createdRowsById.value = new Map();
  }
});

async function onSubmit(event: FormSubmitEvent<z.infer<typeof rescueAuthorizerAssignSchema>>) {
  if (isAssigning.value) return;
  const body = rescueAuthorizerAssignToBody(event.data);

  const ok = await saveAuthorizer(body);
  if (ok) {
    closeWithoutConfirm();
    emit('saved');
  }
}

async function onRemoveAuthorizer() {
  if (isAssigning.value) return;
  const ok = await saveAuthorizer({ authorizer: null });
  if (ok) {
    closeWithoutConfirm();
    emit('saved');
  }
}

function onSaveClick() {
  if (isAssigning.value) return;
  if (state.authorizer == null) {
    toast.add({
      title: 'Selecciona un autorizador',
      color: 'error',
    });
    return;
  }
  void formRef.value?.submit();
}

const createFormState = reactive<RescueAuthorizerContactCreateFormState>({
  name: '',
  position: '',
  email: '',
  phone: '',
});

function resetCreateForm() {
  createFormState.name = '';
  createFormState.position = '';
  createFormState.email = '';
  createFormState.phone = '';
}

function openCreateForm() {
  resetCreateForm();
  showCreateForm.value = true;
}

async function onCreateContactSubmit(
  event: FormSubmitEvent<z.infer<typeof rescueAuthorizerContactCreateSchema>>,
) {
  if (isCreatingContact.value) return;
  const body = rescueAuthorizerContactCreateToBody(props.clientId, event.data);
  const newId = await createContactAsync(body);
  if (newId == null) return;

  createdRowsById.value.set(newId, { id: newId, name: body.name });
  state.authorizer = newId;
  showCreateForm.value = false;
}

function onCreateContactSaveClick() {
  if (isCreatingContact.value) return;
  void createFormRef.value?.submit();
}

const { onFormError } = useFormValidationFeedback();
const { modalProps } = useResponsiveModal();
</script>

<template>
  <UModal
    v-model:open="guardedOpen"
    :dismissible="false"
    :close="{ disabled: isBusy }"
    :title="modalTitle"
    description="Selecciona un autorizador de la lista o registra uno nuevo."
    v-bind="modalProps"
  >
    <template #body>
      <div class="space-y-4">
        <UForm
          ref="formRef"
          :schema="rescueAuthorizerAssignSchema"
          :state="state"
          @submit="onSubmit"
        >
          <UFormField label="Autorizador" name="authorizer" required>
            <USelectMenu
              v-model="state.authorizer"
              v-model:search-term="searchTerm"
              ignore-filter
              value-key="id"
              label-key="name"
              :items="displayItems"
              :loading="dropdownLoading"
              placeholder="Buscar autorizador"
              :disabled="isBusy"
              class="w-full"
            />
          </UFormField>
        </UForm>

        <UAlert
          v-if="isEmpty"
          color="warning"
          variant="subtle"
          icon="i-lucide-user-round-x"
          title="Sin autorizadores registrados"
          description="Este cliente no tiene contactos marcados como autorizador."
        />

        <UButton
          v-if="!showCreateForm"
          color="neutral"
          icon="i-lucide-plus"
          label="Registrar nuevo autorizador"
          size="sm"
          variant="outline"
          :disabled="isBusy"
          @click="openCreateForm"
        />

        <div
          v-else
          class="space-y-3 rounded-lg border border-default p-3"
        >
          <UForm
            ref="createFormRef"
            :schema="rescueAuthorizerContactCreateSchema"
            :state="createFormState"
            class="space-y-3"
            @submit="onCreateContactSubmit"
            @error="onFormError"
          >
            <UFormField label="Nombre" name="name" required>
              <UInput v-model="createFormState.name" class="w-full" />
            </UFormField>
            <UFormField label="Puesto" name="position" required>
              <UInput v-model="createFormState.position" class="w-full" />
            </UFormField>
            <UFormField label="Email" name="email" required>
              <UInput v-model="createFormState.email" type="email" class="w-full" />
            </UFormField>
            <UFormField label="Teléfono" name="phone" required>
              <UInput
                :model-value="createFormState.phone"
                class="w-full"
                type="tel"
                inputmode="tel"
                :placeholder="MEXICO_PHONE_MASK.replaceAll('#', '0')"
                @update:model-value="(value) => (createFormState.phone = formatMexicoPhoneInput(value))"
              />
            </UFormField>
          </UForm>
          <div class="flex justify-end gap-2">
            <UButton
              color="neutral"
              label="Cancelar"
              variant="subtle"
              size="sm"
              :disabled="isCreatingContact"
              @click="showCreateForm = false"
            />
            <UButton
              color="primary"
              label="Guardar contacto"
              size="sm"
              :loading="isCreatingContact"
              :disabled="isCreatingContact"
              @click="onCreateContactSaveClick"
            />
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <UButton
          v-if="currentAuthorizerId != null"
          class="w-full sm:w-auto"
          color="error"
          label="Quitar autorizador"
          variant="ghost"
          :loading="isAssigning"
          :disabled="isBusy"
          @click="onRemoveAuthorizer"
        />
        <div class="flex w-full flex-col gap-2 sm:ml-auto sm:w-auto sm:flex-row">
          <UButton
            color="neutral"
            label="Cancelar"
            variant="subtle"
            :disabled="isBusy"
            @click="requestClose"
          />
          <UButton
            color="primary"
            icon="i-lucide-check"
            label="Confirmar"
            :loading="isAssigning"
            :disabled="isBusy"
            @click="onSaveClick"
          />
        </div>
      </div>
    </template>
  </UModal>

  <SharedDiscardChangesConfirmModal
    v-model:open="discardConfirmOpen"
    @confirm="confirmDiscard"
    @cancel="cancelDiscard"
  />
</template>
