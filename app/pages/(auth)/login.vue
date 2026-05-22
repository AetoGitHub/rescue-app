<script setup lang="ts">
import * as z from 'zod';
import type { FormSubmitEvent, AuthFormField } from '@nuxt/ui';

definePageMeta({
  layout: false,
  middleware: 'guest',
});

const fields: AuthFormField[] = [
  {
    name: 'username',
    type: 'text',
    label: 'Nombre de usuario',
    required: true,
  },
  {
    name: 'password',
    label: 'Contraseña',
    type: 'password',
    required: true,
  },
];

const schema = z.object({
  username: z.string('El nombre de usuario es requerido'),
  password: z.string('La contraseña es requerida'),
});

type Schema = z.output<typeof schema>;

const loginErrorMessage = ref<string | null>(null);
const { fetch: fetchUserSession } = useUserSession();

const { mutate, asyncStatus } = useMutation({
  mutation: ({ username, password }: { username: string; password: string }) =>
    $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        username,
        password,
      },
    }),
  onSuccess: async () => {
    loginErrorMessage.value = null;
    await fetchUserSession();
    await navigateTo('/admin/dashboard');
  },
  onError: (e) => {
    console.error(e);
    loginErrorMessage.value = getSafeLoginErrorMessage(e);
  },
});

function onSubmit(payload: FormSubmitEvent<Schema>) {
  loginErrorMessage.value = null;
  mutate({
    ...payload.data,
  });
}
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4 min-h-screen">
    <UPageCard class="w-full max-w-md">
      <UAuthForm
        :schema="schema"
        title="Sistema operativo de rescates"
        icon="i-lucide-user"
        :fields="fields"
        :submit="{
          label: 'Iniciar sesión',
          size: 'xl',
          class: 'font-bold',
          type: 'submit',
        }"
        :ui="{
          title: 'font-thin uppercase text-xs tracking-[0.25em] text-muted',
        }"
        :loading="asyncStatus === 'loading'"
        @submit="onSubmit"
      />
      <UAlert
        v-if="loginErrorMessage"
        class="mb-4"
        color="error"
        variant="subtle"
        title="No se pudo iniciar sesión"
        :description="loginErrorMessage"
      />

      <p class="mt-4 text-center text-sm">
        <NuxtLink
          to="/password-reset"
          class="text-primary hover:underline"
        >
          ¿Olvidaste tu contraseña?
        </NuxtLink>
      </p>
    </UPageCard>
  </div>
</template>
