<script setup lang="ts">
import { useMutation } from '@pinia/colada';
import {
  adminUserPasswordResetSchema,
  type AdminUserPasswordResetOutput,
} from '~/schemas/password-reset';
import { USER_PASSWORD_RESET_PATH } from '~/constants/user-api';

const props = defineProps<{
  userId: number | null;
  username?: string;
}>();

const open = defineModel<boolean>('open', { required: true });

const toast = useToast();

function emptyState() {
  return {
    new_password: '',
    new_password2: '',
  };
}

const state = reactive(emptyState());
const formRef = ref<{ submit: () => Promise<void> } | null>(null);
const showPassword = ref(false);

watch(open, (v) => {
  if (!v) {
    Object.assign(state, emptyState());
    showPassword.value = false;
  }
});

const { mutateAsync: resetPasswordAsync, asyncStatus } = useMutation({
  mutation: ({ userId, new_password }: { userId: number; new_password: string }) =>
    $fetch(USER_PASSWORD_RESET_PATH(userId), {
      method: 'POST',
      body: { new_password },
    }),
  onError: (e) => {
    toast.add({
      title: 'No se pudo cambiar la contraseña',
      description: getFetchErrorMessage(e),
      color: 'error',
    });
  },
});

const submitting = ref(false);
const isSubmitting = computed(
  () => submitting.value || asyncStatus.value === 'loading',
);

async function onSubmit(payload: { data: AdminUserPasswordResetOutput }) {
  if (isSubmitting.value || props.userId == null) return;
  submitting.value = true;
  try {
    await resetPasswordAsync({
      userId: props.userId,
      new_password: payload.data.new_password,
    });
    toast.add({ title: 'Contraseña actualizada', color: 'success' });
    open.value = false;
  } catch {
    // El toast de error lo muestra la mutación.
  } finally {
    submitting.value = false;
  }
}

async function requestSubmit() {
  if (isSubmitting.value) return;
  await formRef.value?.submit();
}

async function generateAndCopyPassword() {
  const password = generateSecurePassword();
  state.new_password = password;
  state.new_password2 = password;
  showPassword.value = true;
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
  <UModal
    v-model:open="open"
    title="Cambiar contraseña"
    :description="username ? `Para ${username}` : undefined"
    :dismissible="!isSubmitting"
    :ui="{ content: 'max-w-md' }"
  >
    <template #body>
      <UForm
        ref="formRef"
        :schema="adminUserPasswordResetSchema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Nueva contraseña" name="new_password" required>
          <div class="flex gap-2">
            <UInput
              v-model="state.new_password"
              class="min-w-0 flex-1"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              :ui="{ trailing: 'pe-1' }"
            >
              <template #trailing>
                <UButton
                  type="button"
                  color="neutral"
                  variant="link"
                  size="sm"
                  :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                  :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                  :aria-pressed="showPassword"
                  @click="showPassword = !showPassword"
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
              :disabled="isSubmitting"
              @click="generateAndCopyPassword"
            />
          </div>
        </UFormField>
        <UFormField label="Confirmar contraseña" name="new_password2" required>
          <UInput
            v-model="state.new_password2"
            class="w-full"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="new-password"
          />
        </UFormField>
        <p class="flex items-start gap-1.5 text-xs text-muted">
          <UIcon name="i-lucide-info" class="mt-0.5 size-3.5 shrink-0" />
          El cambio se aplica al confirmar, sin necesidad de guardar el usuario.
        </p>
      </UForm>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          type="button"
          color="neutral"
          variant="subtle"
          label="Cancelar"
          :disabled="isSubmitting"
          @click="open = false"
        />
        <UButton
          type="button"
          label="Cambiar contraseña"
          :loading="isSubmitting"
          :disabled="isSubmitting"
          @click="requestSubmit"
        />
      </div>
    </template>
  </UModal>
</template>
