<script setup lang="ts">
import { useMutation, useQueryCache } from '@pinia/colada';
import type { UserCreateBody, UserUpdateBody } from '~/interfaces/auth/user';
import { USER_ROLE_OPTIONS } from '~/constants/user-select-options';
import {
  userCreateSchema,
  userUpdateSchema,
  type UserFormOutputCreate,
  type UserFormOutputUpdate,
} from '~/schemas/user-create';
import {
  formatUsernameInput,
  mapUserDetail,
  type UserFormState,
} from '~/utils/user-detail-map';
import { formatMexicoPhoneInput, MEXICO_PHONE_MASK } from '~/utils/catalog-form';

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
    password: '',
    is_active: true,
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

watch(open, (v) => {
  if (!v) {
    editingId.value = null;
    resetForm();
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
    const u = d as UserFormOutputUpdate;
    const updateBody: UserUpdateBody = {
      username: u.username,
      first_name: u.first_name,
      last_name: u.last_name,
      email: u.email,
      role: u.role,
      phone: u.phone,
      is_active: u.is_active,
    };
    if (u.password.trim() !== '') {
      updateBody.password = u.password.trim();
    }
    mutate({ id, updateBody });
    return;
  }

  const c = d as UserFormOutputCreate;
  const createBody: UserCreateBody = {
    username: c.username,
    first_name: c.first_name,
    last_name: c.last_name,
    email: c.email,
    role: c.role,
    phone: c.phone,
    password: c.password,
  };
  mutate({ id: null, createBody });
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
        <UFormField label="Usuario" name="username">
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
        <UFormField label="Correo" name="email">
          <UInput v-model="state.email" type="email" class="w-full" autocomplete="email" />
        </UFormField>
        <UFormField label="Rol" name="role">
          <USelectMenu
            v-model="state.role"
            :items="[...USER_ROLE_OPTIONS]"
            value-key="value"
            class="w-full"
            variant="subtle"
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
          :label="isEdit ? 'Nueva contraseña' : 'Contraseña'"
          name="password"
          :description="isEdit ? 'Dejar vacío para no cambiar la contraseña' : undefined"
        >
          <UInput
            v-model="state.password"
            class="w-full"
            type="password"
            autocomplete="new-password"
          />
        </UFormField>
        <UFormField v-if="isEdit" label="Activo" name="is_active">
          <UCheckbox v-model="state.is_active" label="Usuario activo" />
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
