<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui';

const items = ref<NavigationMenuItem[][]>([]);

const { user, clear: clearUserSession } = useUserSession();

async function rebuildNavItems() {
  const sections: NavigationMenuItem[][] = [];

  for (const section of ADMIN_NAV_SECTIONS) {
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
