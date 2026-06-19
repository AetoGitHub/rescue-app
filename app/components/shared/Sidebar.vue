<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui';
import type { AdminAbility } from '~~/shared/abilities';
import {
  accessAdministrative,
  accessCatalogs,
  accessConfig,
  accessMyBalance,
  accessOperational,
  accessUsers,
} from '~~/shared/abilities';

type NavLinkItem = NavigationMenuItem & {
  ability: AdminAbility;
};

const NAV_SECTIONS: Array<{
  label: string;
  items: NavLinkItem[];
}> = [
  {
    label: 'Administración',
    items: [
      {
        label: 'Operacional',
        to: '/admin/operational',
        icon: 'i-lucide-file-text',
        ability: accessOperational,
      },
      {
        label: 'Administrativo',
        to: '/admin/administrativo',
        icon: 'i-lucide-receipt',
        ability: accessAdministrative,
      },
      {
        label: 'Mi saldo',
        to: '/admin/my-balance',
        icon: 'i-lucide-wallet',
        ability: accessMyBalance,
      },
    ],
  },
  {
    label: 'Catálogos',
    items: [
      {
        label: 'Compañías',
        to: '/admin/catalogs/companies',
        icon: 'i-lucide-building',
        ability: accessCatalogs,
      },
      {
        label: 'Clientes',
        to: '/admin/catalogs/clients',
        icon: 'i-lucide-users',
        ability: accessCatalogs,
      },
      {
        label: 'Contratos',
        to: '/admin/catalogs/contracts',
        icon: 'i-lucide-file-text',
        ability: accessCatalogs,
      },
      {
        label: 'Servicios',
        to: '/admin/catalogs/services',
        icon: 'i-lucide-wrench',
        ability: accessCatalogs,
      },
      {
        label: 'Cancelación',
        to: '/admin/catalogs/cancellation-reasons',
        icon: 'i-lucide-ban',
        ability: accessCatalogs,
      },
      {
        label: 'Proveedores',
        to: '/admin/catalogs/suppliers',
        icon: 'i-lucide-truck',
        ability: accessCatalogs,
      },
    ],
  },
  {
    label: 'Configuración',
    items: [
      {
        label: 'Usuarios',
        to: '/admin/users',
        icon: 'i-lucide-users-round',
        ability: accessUsers,
      },
      {
        label: 'Configuración SLA',
        to: '/admin/configuracion/sla',
        icon: 'i-lucide-timer',
        ability: accessConfig,
      },
    ],
  },
];

const items = ref<NavigationMenuItem[][]>([]);

const { user, clear: clearUserSession } = useUserSession();

async function rebuildNavItems() {
  const sections: NavigationMenuItem[][] = [];

  for (const section of NAV_SECTIONS) {
    const visibleLinks: NavigationMenuItem[] = [];

    for (const item of section.items) {
      if (await allows(item.ability)) {
        visibleLinks.push({
          label: item.label,
          to: item.to,
          icon: item.icon,
        });
      }
    }

    if (visibleLinks.length > 0) {
      sections.push([
        { label: section.label, type: 'label' },
        ...visibleLinks,
      ]);
    }
  }

  items.value = sections;
}

watch(
  () => user.value?.role,
  () => {
    void rebuildNavItems();
  },
  { immediate: true },
);

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
            alt: user?.name
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
          :loading="logoutStatus === 'loading'"
          @click="() => logout()"
        />
      </div>
    </template>
  </UDashboardSidebar>
</template>
