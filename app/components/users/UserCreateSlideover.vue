<script setup lang="ts">
import { useMutation, useQueryCache } from '@pinia/colada';
import type { UserCreateBody, UserUpdateBody } from '~/interfaces/auth/user';
import { USER_ROLE_OPTIONS } from '~/constants/user-select-options';
import {
  adminUserPasswordResetSchema,
  type AdminUserPasswordResetOutput,
} from '~/schemas/password-reset';
import { USER_PASSWORD_RESET_PATH } from '~/constants/user-api';
import {
  userCreateSchema,
  userCreateToCreateBody,
  userUpdateSchema,
  userUpdateToUpdateBody,
  type UserFormOutputCreate,
  type UserFormOutputUpdate,
} from '~/schemas/user-create';

const toast = useToast();

const open = ref(false);
const editingId = ref<number | null>(null);
const detailPending = ref(false);

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
  };
}

const state = reactive(emptyState());
const commissionModel = usePercentStringNumberModel(toRef(state, 'commission'));

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
      `/api/auth/user/detail/${id}/`,
    );
    Object.assign(state, emptyState(), mapUserDetail(raw));
  } catch (e) {
    console.error(e);
    toast.add({
      title: 'No se pudo cargar el usuario',
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

function emptyPasswordResetState() {
  return {
    new_password: '',
    new_password2: '',
  };
}

const passwordResetState = reactive(emptyPasswordResetState());
const passwordResetFormRef = ref<{ submit: () => Promise<void> } | null>(null);
const showCreatePassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);

function resetPasswordVisibility() {
  showCreatePassword.value = false;
  showNewPassword.value = false;
  showConfirmPassword.value = false;
}

function resetPasswordResetForm() {
  Object.assign(passwordResetState, emptyPasswordResetState());
}

watch(open, (v) => {
  if (!v) {
    editingId.value = null;
    resetForm();
    resetPasswordResetForm();
    resetPasswordVisibility();
  }
});

const queryCache = useQueryCache();

const { mutate, asyncStatus } = useMutation({
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

function onSubmit(payload: {
  data: UserFormOutputCreate | UserFormOutputUpdate;
}) {
  const d = payload.data;
  const id = editingId.value;

  if (id != null) {
    mutate({
      id,
      updateBody: userUpdateToUpdateBody(d as UserFormOutputUpdate),
    });
    return;
  }

  mutate({
    id: null,
    createBody: userCreateToCreateBody(d as UserFormOutputCreate),
  });
}

function onFormError() {
  console.error('Validación de formulario de usuario');
}

function cancel() {
  open.value = false;
}

async function requestSubmit() {
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

const { mutateAsync: resetPasswordAsync, asyncStatus: passwordResetStatus } =
  useMutation({
    mutation: ({
      userId,
      new_password,
    }: {
      userId: number;
      new_password: string;
    }) =>
      $fetch(USER_PASSWORD_RESET_PATH(userId), {
        method: 'POST',
        body: { new_password },
      }),
    onError: (e) => {
      toast.add({
        title: 'No se pudo restablecer la contraseña',
        description: getFetchErrorMessage(e),
        color: 'error',
      });
    },
  });

const isResettingPassword = computed(
  () => passwordResetStatus.value === 'loading',
);

async function onPasswordResetSubmit(payload: {
  data: AdminUserPasswordResetOutput;
}) {
  const userId = editingId.value;
  if (userId == null) return;

  try {
    await resetPasswordAsync({
      userId,
      new_password: payload.data.new_password,
    });
    toast.add({
      title: 'Contraseña restablecida',
      color: 'success',
    });
    resetPasswordResetForm();
  } catch {
    // Error toast handled in mutation
  }
}

async function requestPasswordResetSubmit() {
  await passwordResetFormRef.value?.submit();
}
</script>

<template>
  <USlideover
    v-model:open="open"
    :title="isEdit ? 'Editar usuario' : 'Nuevo usuario'"
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
        class="space-y-4 overflow-y-auto max-h-[calc(100vh-12rem)] pe-1"
        @submit="onSubmit"
        @error="onFormError"
      >
        <UFormField label="Usuario" name="username" required>
          <UInput
            :model-value="state.username"
            class="w-full uppercase"
            autocomplete="username"
            @update:model-value="(v) => (state.username = formatUsernameInput(v))"
          />
        </UFormField>
        <UFormField label="Nombre" name="first_name">
          <UInput v-model="state.first_name" class="w-full" autocomplete="given-name" />
        </UFormField>
        <UFormField label="Apellidos" name="last_name">
          <UInput v-model="state.last_name" class="w-full" autocomplete="family-name" />
        </UFormField>
        <UFormField label="Correo" name="email" required>
          <UInput v-model="state.email" type="email" class="w-full" autocomplete="email" />
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
        <UFormField label="Comisión" name="commission" required>
          <UInputNumber
            v-model="commissionModel"
            v-bind="catalogPercentInputProps"
            placeholder="0.00"
          />
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
        <UFormField v-if="isEdit" label="Activo" name="is_active">
          <UCheckbox v-model="state.is_active" label="Usuario activo" />
        </UFormField>
      </UForm>

      <section
        v-if="isEdit && editingId != null && !detailPending"
        class="mt-6 space-y-4 border-t border-default pt-6"
      >
        <div>
          <h3 class="text-sm font-semibold text-highlighted">
            Restablecer contraseña
          </h3>
          <p class="mt-1 text-xs text-muted">
            Define una nueva contraseña para este usuario.
          </p>
        </div>

        <UForm
          ref="passwordResetFormRef"
          :schema="adminUserPasswordResetSchema"
          :state="passwordResetState"
          class="space-y-4"
          @submit="onPasswordResetSubmit"
        >
          <UFormField label="Nueva contraseña" name="new_password" required>
            <UInput
              v-model="passwordResetState.new_password"
              class="w-full"
              :type="showNewPassword ? 'text' : 'password'"
              autocomplete="new-password"
              :ui="{ trailing: 'pe-1' }"
            >
              <template #trailing>
                <UButton
                  type="button"
                  color="neutral"
                  variant="link"
                  size="sm"
                  :icon="showNewPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                  :aria-label="showNewPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                  :aria-pressed="showNewPassword"
                  @click="showNewPassword = !showNewPassword"
                />
              </template>
            </UInput>
          </UFormField>
          <UFormField
            label="Confirmar contraseña"
            name="new_password2"
            required
          >
            <UInput
              v-model="passwordResetState.new_password2"
              class="w-full"
              :type="showConfirmPassword ? 'text' : 'password'"
              autocomplete="new-password"
              :ui="{ trailing: 'pe-1' }"
            >
              <template #trailing>
                <UButton
                  type="button"
                  color="neutral"
                  variant="link"
                  size="sm"
                  :icon="showConfirmPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                  :aria-label="showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                  :aria-pressed="showConfirmPassword"
                  @click="showConfirmPassword = !showConfirmPassword"
                />
              </template>
            </UInput>
          </UFormField>
          <div class="flex justify-end">
            <UButton
              type="button"
              color="primary"
              label="Restablecer contraseña"
              icon="i-lucide-key-round"
              :loading="isResettingPassword"
              :disabled="isResettingPassword"
              @click="requestPasswordResetSubmit"
            />
          </div>
        </UForm>
      </section>
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

<style>
/* Hide the password reveal button in Edge */
::-ms-reveal {
  display: none;
}
</style>
