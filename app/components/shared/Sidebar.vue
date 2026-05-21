<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui';

const items = computed<NavigationMenuItem[][]>(() => [
  [
    { label: 'Administración', type: 'label' },
    {
      label: 'Dashboard',
      icon: 'i-lucide-layout-dashboard',
      to: '/admin/dashboard',
    },
    {
      label: 'Operacional',
      to: '/admin/operational',
      icon: 'i-lucide-file-text',
    },
  ],
  [
    { label: 'Catálogos', type: 'label' },
    {
      label: 'Compañías',
      to: '/admin/catalogs/companies',
      icon: 'i-lucide-building',
    },
    {
      label: 'Clientes',
      to: '/admin/catalogs/clients',
      icon: 'i-lucide-users',
    },
    {
      label: 'Contratos',
      to: '/admin/catalogs/contracts',
      icon: 'i-lucide-file-text',
    },
    {
      label: 'Servicios',
      to: '/admin/catalogs/services',
      icon: 'i-lucide-wrench',
    },
    {
      label: 'Proveedores',
      to: '/admin/catalogs/suppliers',
      icon: 'i-lucide-truck',
    },
  ],
  [
    { label: 'Configuración', type: 'label' },
    {
      label: 'Usuarios',
      to: '/admin/users',
      icon: 'i-lucide-users-round',
    },
  ],
]);

const { user } = useUserSession();

const { mutate: logout } = useMutation({
  mutation: () => $fetch('/api/auth/logout', { method: 'POST' }),
  onSuccess: () => {
    navigateTo('/login');
  },
});
</script>

<template>
  <UDashboardSidebar collapsible resizable>
    <template #header="{ collapsed }">
      <ClientOnly>
        <template #fallback>
          <USkeleton class="size-8 rounded-full" />
        </template>

        <SharedAetoLogo class="size-8" />
      </ClientOnly>

      <div
        v-show="!collapsed"
        class="font-display font-extrabold tracking-tight leading-none text-lg"
      >
        <span class="text-black dark:text-white">AETO</span>
        <span class="text-primary">RESCUE</span>
      </div>
    </template>
    <template #default="{ collapsed }">
      <UNavigationMenu
        :collapsed="collapsed"
        orientation="vertical"
        :items="items"
      />
    </template>

    <template #footer="{ collapsed }">
      <div class="flex flex-col gap-4 w-full mb-4">
        <UUser
          :name="collapsed ? undefined : user?.name"
          :description="collapsed ? undefined : user?.role"
          :avatar="{
            loading: 'lazy',
            src: 'https://github.com/benjamincanac.png',
          }"
          :ui="{
            name: 'capitalize',
          }"
        />

        <UButton
          color="neutral"
          class="w-full"
          variant="ghost"
          icon="i-lucide-log-out"
          :label="collapsed ? undefined : 'Cerrar sesión'"
          @click="() => logout()"
        />
      </div>
    </template>
  </UDashboardSidebar>
</template>
