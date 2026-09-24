<script setup lang="ts">
import { useMutation, useQueryCache } from '@pinia/colada';
import type { UserCreateBody, UserUpdateBody } from '~/interfaces/auth/user';
import {
  USER_COMMISSION_FIELD_HELP,
  USER_ROLE_OPTIONS,
} from '~/constants/user-select-options';
import {
  userCreateSchema,
  userCreateToCreateBody,
  userUpdateSchema,
  userUpdateToUpdateBody,
  type UserFormOutputCreate,
  type UserFormOutputUpdate,
} from '~/schemas/user-create';
import {
  adminListSlideoverBodyUi,
  adminListSlideoverContentClass,
  adminListSlideoverScrollClass,
} from '~/constants/admin-list-layout';
import { parseAllowedClients } from '~/utils/allowed-clients';

const toast = useToast();

const open = ref(false);
const editingId = ref<number | null>(null);
const detailPending = ref(false);
/** Usuario tal como está guardado; el modal de contraseña no usa el valor en edición. */
const loadedUsername = ref('');

const isEdit = computed(() => editingId.value != null);

const formSchema = computed(() =>
  isEdit.value ? userUpdateSchema : userCreateSchema,
);

function emptyState(): UserFormState {
  return {
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    role: 'seller',
    phone: '',
    commission: '0.00',
    password: '',
    is_active: true,
    allowed_clients: [],
  };
}

const state = reactive(emptyState());
/** Nombres de los clientes ya asignados (detalle) para los chips del selector. */
const knownAllowedClients = ref<{ id: number; name: string }[]>([]);
const isClientRole = computed(() => state.role === 'client');

watch(
  () => state.role,
  (role) => {
    if (role !== 'client' && state.allowed_clients.length > 0) {
      state.allowed_clients = [];
    }
  },
);
const commissionModel = usePercentStringNumberModel(toRef(state, 'commission'));

function resetForm() {
  Object.assign(state, emptyState());
  knownAllowedClients.value = [];
  loadedUsername.value = '';
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
      `/api/auth/user/detail/${id}/`,
    );
    Object.assign(state, emptyState(), mapUserDetail(raw));
    knownAllowedClients.value = parseAllowedClients(raw.allowed_clients);
    loadedUsername.value = state.username;
  } catch (e) {
    console.error(e);
    toast.add({
      title: 'No se pudo cargar el usuario',
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

const passwordModalOpen = ref(false);
const showCreatePassword = ref(false);
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

watch(open, (v) => {
  if (!v) {
    editingId.value = null;
    passwordModalOpen.value = false;
    showCreatePassword.value = false;
    resetForm();
  }
});

const queryCache = useQueryCache();

const { mutateAsync: saveUserAsync, asyncStatus } = useMutation({
  mutation: ({
    createBody,
    updateBody,
    id,
  }: {
    id: number | null;
    createBody?: UserCreateBody;
    updateBody?: UserUpdateBody;
  }) =>
    id != null
      ? $fetch(`/api/auth/user/update/${id}/`, {
          method: 'PUT',
          body: updateBody,
        })
      : $fetch('/api/auth/user/create/', { method: 'POST', body: createBody }),
  async onSuccess() {
    const wasEdit = editingId.value != null;
    toast.add({
      title: wasEdit ? 'Usuario actualizado' : 'Usuario creado',
      color: 'success',
    });
    await queryCache.invalidateQueries({ key: ['users'] });
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

const savingUser = ref(false);
const isSavingUser = computed(
  () => savingUser.value || asyncStatus.value === 'loading',
);
const formRef = ref<{ submit: () => Promise<void> } | null>(null);

async function onSubmit(payload: {
  data: UserFormOutputCreate | UserFormOutputUpdate;
}) {
  if (isSavingUser.value) return;
  savingUser.value = true;
  const d = payload.data;
  const id = editingId.value;

  try {
    if (id != null) {
      await saveUserAsync({
        id,
        updateBody: userUpdateToUpdateBody(d as UserFormOutputUpdate),
      });
      return;
    }

    await saveUserAsync({
      id: null,
      createBody: userCreateToCreateBody(d as UserFormOutputCreate),
    });
  } catch {
    // El toast de error lo muestra la mutación.
  } finally {
    savingUser.value = false;
  }
}

const { onFormError } = useFormValidationFeedback();

function cancel() {
  if (isSavingUser.value) return;
  requestClose();
}

async function requestSubmit() {
  if (isSavingUser.value) return;
  await formRef.value?.submit();
}

async function generateAndCopyPassword() {
  const password = generateSecurePassword();
  state.password = password;
  showCreatePassword.value = true;
  const copied = await copyTextToClipboard(password);
  toast.add({
    title: copied ? 'Contraseña generada y copiada' : 'Contraseña generada',
    description: copied
      ? 'La contraseña se copió al portapapeles.'
      : 'No se pudo copiar al portapapeles.',
    color: copied ? 'success' : 'warning',
  });
}
</script>

<template>
  <USlideover
    v-model:open="guardedOpen"
    :title="isEdit ? 'Editar usuario' : 'Nuevo usuario'"
    :ui="{
      content: adminListSlideoverContentClass,
      body: adminListSlideoverBodyUi.body,
    }"
  >
    <UButton
      icon="i-lucide-plus"
      label="Nuevo usuario"
      size="lg"
      @click="prepareCreate"
    />

    <template #body>
      <div v-if="detailPending && isEdit" class="flex justify-center py-8">
        <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-muted" />
      </div>
      <UForm
        v-show="!detailPending || !isEdit"
        ref="formRef"
        :schema="formSchema"
        :state="state"
        :class="['space-y-6', adminListSlideoverScrollClass, 'pe-3!']"
        @submit="onSubmit"
        @error="onFormError"
      >
        <UFormField v-if="isEdit" name="is_active">
          <div
            class="flex items-center justify-between gap-3 rounded-lg border border-default p-3"
          >
            <div class="min-w-0">
              <p class="text-sm font-medium text-highlighted">
                {{ state.is_active ? 'Usuario activo' : 'Usuario inactivo' }}
              </p>
              <p class="text-xs text-muted">
                Desactívalo para bloquear su acceso al sistema.
              </p>
            </div>
            <USwitch v-model="state.is_active" aria-label="Usuario activo" />
          </div>
        </UFormField>

        <section class="space-y-4">
          <h3 class="text-sm font-semibold text-highlighted">Datos personales</h3>
          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="Nombre" name="first_name">
              <UInput v-model="state.first_name" class="w-full" autocomplete="given-name" />
            </UFormField>
            <UFormField label="Apellidos" name="last_name">
              <UInput v-model="state.last_name" class="w-full" autocomplete="family-name" />
            </UFormField>
          </div>
          <UFormField label="Correo" name="email" required>
            <UInput v-model="state.email" type="email" class="w-full" autocomplete="email" />
          </UFormField>
          <UFormField label="Teléfono" name="phone">
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
        </section>

        <section class="space-y-4 border-t border-default pt-6">
          <h3 class="text-sm font-semibold text-highlighted">Acceso</h3>
          <UFormField label="Usuario" name="username" required>
            <UInput
              :model-value="state.username"
              class="w-full uppercase"
              autocomplete="username"
              @update:model-value="(v) => (state.username = formatUsernameInput(v))"
            />
          </UFormField>
          <UFormField label="Rol" name="role" required>
            <USelectMenu
              v-model="state.role"
              :items="[...USER_ROLE_OPTIONS]"
              value-key="value"
              class="w-full"
              variant="subtle"
            />
          </UFormField>
          <UFormField
            v-if="!isEdit"
            label="Contraseña"
            name="password"
            required
          >
            <div class="flex gap-2">
              <UInput
                v-model="state.password"
                class="min-w-0 flex-1"
                :type="showCreatePassword ? 'text' : 'password'"
                autocomplete="new-password"
                :ui="{ trailing: 'pe-1' }"
              >
                <template #trailing>
                  <UButton
                    type="button"
                    color="neutral"
                    variant="link"
                    size="sm"
                    :icon="showCreatePassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                    :aria-label="showCreatePassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                    :aria-pressed="showCreatePassword"
                    @click="showCreatePassword = !showCreatePassword"
                  />
                </template>
              </UInput>
              <UButton
                type="button"
                color="neutral"
                variant="subtle"
                icon="i-lucide-wand-sparkles"
                label="Generar"
                class="shrink-0"
                @click="generateAndCopyPassword"
              />
            </div>
          </UFormField>
          <div
            v-else
            class="flex items-center justify-between gap-3 rounded-lg border border-default p-3"
          >
            <div class="min-w-0">
              <p class="text-sm font-medium text-highlighted">Contraseña</p>
              <p class="text-xs text-muted">
                Se cambia por separado, sin guardar el usuario.
              </p>
            </div>
            <UButton
              type="button"
              color="primary"
              variant="outline"
              icon="i-lucide-key-round"
              label="Cambiar"
              class="shrink-0"
              :disabled="isSavingUser"
              @click="passwordModalOpen = true"
            />
          </div>
        </section>

        <section
          v-if="isClientRole"
          class="space-y-4 border-t border-default pt-6"
        >
          <div>
            <h3 class="text-sm font-semibold text-highlighted">Clientes asignados</h3>
            <p class="mt-1 text-xs text-muted">
              Seleccionar todo asigna los clientes existentes hoy. Los clientes que se
              creen después no se asignan automáticamente.
            </p>
          </div>
          <UFormField name="allowed_clients">
            <UsersAllowedClientsPicker
              v-model="state.allowed_clients"
              :known-clients="knownAllowedClients"
              :disabled="isSavingUser"
            />
          </UFormField>
        </section>

        <section v-if="!isClientRole" class="border-t border-default pt-6">
          <UFormField
            label="Comisión"
            name="commission"
            required
            :help="USER_COMMISSION_FIELD_HELP"
          >
            <UInputNumber
              v-model="commissionModel"
              v-bind="catalogPercentInputProps"
              placeholder="0.00"
            />
          </UFormField>
        </section>
      </UForm>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <UButton
          type="button"
          color="neutral"
          variant="subtle"
          label="Cancelar"
          :disabled="isSavingUser"
          @click="cancel"
        />
        <UButton
          type="button"
          label="Guardar"
          :loading="isSavingUser || (detailPending && isEdit)"
          :disabled="isSavingUser || (detailPending && isEdit)"
          @click="requestSubmit"
        />
      </div>
    </template>
  </USlideover>

  <UsersUserPasswordResetModal
    v-model:open="passwordModalOpen"
    :user-id="editingId"
    :username="loadedUsername"
  />

  <SharedDiscardChangesConfirmModal
    v-model:open="discardConfirmOpen"
    @confirm="confirmDiscard"
    @cancel="cancelDiscard"
  />
</template>

<style>
/* Hide the password reveal button in Edge */
::-ms-reveal {
  display: none;
}
</style>
