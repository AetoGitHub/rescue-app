<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui';
import {
  passwordResetConfirmSchema,
  passwordResetRequestSchema,
  type PasswordResetConfirmOutput,
  type PasswordResetRequestOutput,
} from '~/schemas/password-reset';

definePageMeta({
  layout: false,
  middleware: 'guest',
});

const toast = useToast();
const step = ref<'request' | 'confirm'>('request');
const requestSuccessMessage = ref<string | null>(null);
const errorMessage = ref<string | null>(null);

const requestState = reactive({
  identifier: '',
});

const confirmState = reactive({
  code: '',
  password: '',
  password2: '',
});

const { mutateAsync: requestResetAsync, asyncStatus: requestStatus } = useMutation({
  mutation: (body: PasswordResetRequestOutput) =>
    $fetch('/api/auth/password-reset/request', {
      method: 'POST',
      body,
    }),
  onSuccess: () => {
    errorMessage.value = null;
    requestSuccessMessage.value =
      'Si existe una cuenta con ese correo o usuario, recibirás un código para restablecer tu contraseña.';
    step.value = 'confirm';
  },
  onError: (e) => {
    console.error(e);
    errorMessage.value = getPasswordResetErrorMessage(e);
  },
});

const { mutateAsync: confirmResetAsync, asyncStatus: confirmStatus } = useMutation({
  mutation: (body: PasswordResetConfirmOutput) =>
    $fetch('/api/auth/password-reset/confirm', {
      method: 'POST',
      body,
    }),
  onSuccess: async () => {
    errorMessage.value = null;
    toast.add({
      title: 'Contraseña actualizada',
      description: 'Ya puedes iniciar sesión con tu nueva contraseña.',
      color: 'success',
    });
    await navigateTo('/login');
  },
  onError: (e) => {
    console.error(e);
    errorMessage.value = getPasswordResetErrorMessage(e);
  },
});

const requestSubmitting = ref(false);
const confirmSubmitting = ref(false);
const isRequestSubmitting = computed(
  () => requestSubmitting.value || requestStatus.value === 'loading',
);
const isConfirmSubmitting = computed(
  () => confirmSubmitting.value || confirmStatus.value === 'loading',
);

async function onRequestSubmit(
  payload: FormSubmitEvent<PasswordResetRequestOutput>,
) {
  if (isRequestSubmitting.value) return;
  requestSubmitting.value = true;
  errorMessage.value = null;
  requestSuccessMessage.value = null;
  try {
    await requestResetAsync(payload.data);
  } catch {
    // El mensaje lo establece onError.
  } finally {
    requestSubmitting.value = false;
  }
}

async function onConfirmSubmit(
  payload: FormSubmitEvent<PasswordResetConfirmOutput>,
) {
  if (isConfirmSubmitting.value) return;
  confirmSubmitting.value = true;
  errorMessage.value = null;
  try {
    await confirmResetAsync(payload.data);
  } catch {
    // El mensaje lo establece onError.
  } finally {
    confirmSubmitting.value = false;
  }
}

function goBackToRequest() {
  if (isConfirmSubmitting.value) return;
  step.value = 'request';
  errorMessage.value = null;
  requestSuccessMessage.value = null;
}
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
    <UPageCard class="w-full max-w-md">
      <div class="mb-6 space-y-2 text-center">
        <h1
          class="font-thin text-xs uppercase tracking-[0.25em] text-muted"
        >
          Sistema operativo de rescates
        </h1>
        <p class="text-lg font-semibold text-default">
          {{ step === 'request' ? 'Recuperar contraseña' : 'Nueva contraseña' }}
        </p>
        <p
          v-if="step === 'confirm'"
          class="text-sm text-muted"
        >
          Introduce el código que recibiste y elige una contraseña nueva.
        </p>
      </div>

      <UAlert
        v-if="requestSuccessMessage && step === 'confirm'"
        class="mb-4"
        color="success"
        variant="subtle"
        title="Solicitud enviada"
        :description="requestSuccessMessage"
      />

      <UAlert
        v-if="errorMessage"
        class="mb-4"
        color="error"
        variant="subtle"
        title="No se pudo completar"
        :description="errorMessage"
      />

      <UForm
        v-if="step === 'request'"
        :schema="passwordResetRequestSchema"
        :state="requestState"
        class="space-y-4"
        @submit="onRequestSubmit"
      >
        <UFormField
          label="Correo o usuario"
          name="identifier"
          required
        >
          <UInput
            v-model="requestState.identifier"
            type="text"
            class="w-full"
            autocomplete="email"
            placeholder="usuario@correo.com"
          />
        </UFormField>

        <UButton
          type="submit"
          block
          size="xl"
          class="font-bold"
          label="Enviar código"
          :loading="isRequestSubmitting"
          :disabled="isRequestSubmitting"
        />
      </UForm>

      <UForm
        v-else
        :schema="passwordResetConfirmSchema"
        :state="confirmState"
        class="space-y-4"
        @submit="onConfirmSubmit"
      >
        <UFormField
          label="Código"
          name="code"
          required
        >
          <UInput
            v-model="confirmState.code"
            type="text"
            class="w-full"
            autocomplete="one-time-code"
            placeholder="Código de verificación"
          />
        </UFormField>

        <UFormField
          label="Nueva contraseña"
          name="password"
          required
        >
          <UInput
            v-model="confirmState.password"
            type="password"
            class="w-full"
            autocomplete="new-password"
          />
        </UFormField>

        <UFormField
          label="Confirmar contraseña"
          name="password2"
          required
        >
          <UInput
            v-model="confirmState.password2"
            type="password"
            class="w-full"
            autocomplete="new-password"
          />
        </UFormField>

        <UButton
          type="submit"
          block
          size="xl"
          class="font-bold"
          label="Restablecer contraseña"
          :loading="isConfirmSubmitting"
          :disabled="isConfirmSubmitting"
        />

        <UButton
          type="button"
          block
          color="neutral"
          variant="ghost"
          label="Volver a solicitar código"
          :disabled="isConfirmSubmitting"
          @click="goBackToRequest"
        />
      </UForm>

      <p class="mt-6 text-center text-sm">
        <NuxtLink
          to="/login"
          class="text-primary hover:underline"
        >
          Volver al inicio de sesión
        </NuxtLink>
      </p>
    </UPageCard>
  </div>
</template>
