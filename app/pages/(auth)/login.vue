<script setup lang="ts">
import * as z from 'zod';
import type { FormSubmitEvent, AuthFormField } from '@nuxt/ui';

definePageMeta({
  layout: false,
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
  email: z.email('Email no válido'),
  password: z
    .string('La contraseña es requerida')
    .min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

type Schema = z.output<typeof schema>;

function onSubmit(payload: FormSubmitEvent<Schema>) {
  console.log('Submitted', payload);
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
        }"
        :ui="{
          title: 'font-thin uppercase text-xs tracking-[0.25em] text-muted',
        }"
        @submit="onSubmit"
      />
    </UPageCard>
  </div>
</template>
