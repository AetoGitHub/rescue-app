<script setup lang="ts">
import type { TableColumn, TableRow } from '@nuxt/ui';
import type { User, UserRole } from '~/interfaces/auth/user';
import { USER_ROLE_OPTIONS } from '~/constants/user-select-options';

useHead({
  title: 'Usuarios',
});

const slideoverRef = ref<{ openEdit: (id: number) => void | Promise<void> } | null>(null);
const tableRef = useTemplateRef('table');

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
  key: () => ['users'],
  path: '/api/auth/user/list/',
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
  <UDashboardPanel>
    <template #header>
      <SharedNavbar title="Usuarios" />
    </template>
    <template #body>
      <UContainer>
        <div class="flex flex-row justify-between items-center mb-4">
          <div>
            <h1 class="text-3xl font-bold tracking-tight">Usuarios</h1>
            <p class="mt-1 text-sm text-muted">
              Gestiona las cuentas y permisos del sistema
            </p>
          </div>

          <UsersUserCreateSlideover ref="slideoverRef" />
        </div>

        <USeparator />

        <div class="flex flex-row gap-2 my-4">
          <UInput
            leading-icon="i-lucide-search"
            placeholder="Buscar usuario"
            class="flex-1"
            variant="subtle"
            :ui="{
              base: 'bg-default',
            }"
          />

          <UButton label="Todos" variant="subtle" color="primary" />
        </div>

        <UTable
          ref="table"
          sticky
          class="h-80"
          :columns="columns"
          :data="rows"
          :loading="isInitialLoading"
          :get-row-id="(row: User) => String(row.id)"
          @select="onRowSelect"
        />
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
