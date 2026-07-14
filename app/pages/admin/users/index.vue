<script setup lang="ts">
import { refDebounced } from '@vueuse/core';
import type { TableColumn, TableRow } from '@nuxt/ui';
import type { User, UserRole } from '~/interfaces/auth/user';
import { USER_ROLE_OPTIONS } from '~/constants/user-select-options';
import { adminListTableClass } from '~/constants/admin-list-layout';

useHead({
  title: 'Usuarios',
});

const slideoverRef = ref<{ openEdit: (id: number) => void | Promise<void> } | null>(null);
const tableRef = useTemplateRef('table');
const search = ref('');
const debouncedName = refDebounced(search, 300);

function userRoleLabel(role: UserRole | string) {
  return USER_ROLE_OPTIONS.find((o) => o.value === role)?.label ?? String(role);
}

function onRowSelect(_e: Event, row: TableRow<User>) {
  const id = row.original.id;
  if (id != null) {
    void slideoverRef.value?.openEdit(id);
  }
}

const {
  rows,
  asyncStatus,
  hasNextPage,
  loadNextPage,
  isInitialLoading,
} = useCatalogInfiniteList<User>({
  key: () => ['users', debouncedName.value.trim()],
  path: '/api/auth/user/list/',
  query: () => {
    const name = debouncedName.value.trim();
    return name ? { name } : undefined;
  },
});

usePaginatedTableInfiniteScroll({
  tableRef,
  hasNextPage,
  loadNextPage,
  asyncStatus,
});

const columns: TableColumn<User>[] = [
  {
    accessorKey: 'username',
    header: 'Usuario',
  },
  {
    id: 'nombre',
    accessorFn: (row) =>
      [row.first_name, row.last_name].filter(Boolean).join(' ').trim() || '—',
    header: 'Nombre',
  },
  {
    accessorKey: 'email',
    header: 'Correo',
  },
  {
    id: 'rol',
    accessorFn: (row) => userRoleLabel(row.role),
    header: 'Rol',
  },
  {
    accessorKey: 'phone',
    header: 'Teléfono',
  },
  {
    id: 'estado',
    accessorFn: (row) => (row.is_active ? 'Activo' : 'Inactivo'),
    header: 'Estado',
  },
];
</script>

<template>
  <AdminListPageShell
    navbar-title="Usuarios"
    title="Usuarios"
    description="Gestiona las cuentas y permisos del sistema"
  >
    <template #actions>
      <UsersUserCreateSlideover ref="slideoverRef" />
    </template>

    <template #filters>
      <UInput
        v-model="search"
        leading-icon="i-lucide-search"
        placeholder="Buscar usuario"
        class="flex-1"
        variant="subtle"
        :ui="{
          base: 'bg-default',
        }"
      />

      <UButton label="Todos" variant="subtle" color="primary" />
    </template>

    <UTable
      ref="table"
      sticky
      :class="adminListTableClass"
      :columns="columns"
      :data="rows"
      :loading="isInitialLoading"
      :get-row-id="(row: User) => String(row.id)"
      @select="onRowSelect"
    />
  </AdminListPageShell>
</template>
