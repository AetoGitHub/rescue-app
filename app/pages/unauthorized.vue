<script setup lang="ts">
definePageMeta({
  layout: false,
  middleware: 'auth',
});

useHead({
  title: 'Acceso denegado',
});

const { clear: clearUserSession } = useUserSession();

const { mutate: logout, asyncStatus: logoutStatus } = useMutation({
  mutation: async () => {
    await $fetch('/api/auth/logout', { method: 'POST' });
    await clearUserSession();
  },
  onSuccess: async () => {
    await navigateTo('/login', { replace: true });
  },
});
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
    <UPageCard class="w-full max-w-md text-center">
      <SharedAetoLogo class="mx-auto size-16" />
      <h1 class="mt-4 text-xl font-semibold tracking-tight">
        Sin acceso al panel
      </h1>
      <p class="mt-2 text-sm text-muted">
        Tu cuenta no tiene permisos para usar el sistema operativo de rescates.
        Si crees que es un error, contacta al administrador.
      </p>
      <UButton
        class="mt-6"
        color="neutral"
        variant="outline"
        icon="i-lucide-log-out"
        label="Cerrar sesión"
        :loading="logoutStatus === 'loading'"
        @click="() => logout()"
      />
    </UPageCard>
  </div>
</template>
