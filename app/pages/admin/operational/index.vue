<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui';

import { OPERATIONAL_KANBAN_COLUMNS } from '~/constants/operational-kanban';

const rescueRequestModalRef = ref<{
  openCreate: () => void;
} | null>(null);

const columnVisibility = ref<Record<string, boolean>>(
  Object.fromEntries(
    OPERATIONAL_KANBAN_COLUMNS.map((column) => [column.id, true]),
  ),
);

const visibleColumns = computed(() =>
  OPERATIONAL_KANBAN_COLUMNS.filter(
    (column) => columnVisibility.value[column.id],
  ),
);

type KanbanColumnMenuItem = DropdownMenuItem & {
  accentColor: string;

  columnId: string;
};

const columnDropdownItems = computed((): KanbanColumnMenuItem[] =>
  OPERATIONAL_KANBAN_COLUMNS.map((column) => ({
    label: column.title,

    type: 'checkbox' as const,

    columnId: column.id,

    accentColor: column.accentColor,

    checked: columnVisibility.value[column.id] ?? true,

    onUpdateChecked(checked: boolean) {
      columnVisibility.value[column.id] = checked;
    },

    onSelect(e: Event) {
      e.preventDefault();
    },
  })),
);

const requestedColumnItems = [{ id: 1 }];
</script>

<template>
  <UDashboardPanel
    :ui="{
      body: 'flex flex-col min-h-0 flex-1 overflow-hidden bg-elevated dark:bg-default',
    }"
  >
    <template #header>
      <SharedNavbar title="Operacional" />
    </template>

    <template #body>
      <div class="flex min-h-0 flex-1 flex-col gap-4 p-4 sm:p-6">
        <div class="shrink-0 flex flex-col gap-4">
          <div class="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div class="flex flex-row gap-3 flex-wrap">
              <UInput
                leading-icon="i-lucide-search"
                placeholder="Buscar folio"
              />

              <UFieldGroup>
                <UButton color="primary" label="Todos" variant="solid" />

                <UButton color="neutral" label="Rescate" variant="subtle" />

                <UButton color="neutral" label="Préstamo" variant="subtle" />

                <UButton color="neutral" label="Cotización" variant="subtle" />

                <UButton color="neutral" label="Proyecto" variant="subtle" />
              </UFieldGroup>

              <UButton
                color="neutral"
                label="Con anticipo pendiente"
                variant="subtle"
              />

              <UFieldGroup>
                <UButton color="neutral" label="Sin filtro" variant="solid" />

                <UButton color="neutral" label="Alerta SLA" variant="subtle" />

                <UButton
                  color="neutral"
                  label="Alerta actualización"
                  variant="subtle"
                />
              </UFieldGroup>

              <UFieldGroup>
                <UButton
                  color="neutral"
                  label="Agente: todos"
                  variant="solid"
                />

                <UButton color="neutral" label="Trabajando" variant="subtle" />

                <UButton
                  color="neutral"
                  label="Requiere humano"
                  variant="subtle"
                />
              </UFieldGroup>
            </div>

            <div class="ml-auto flex flex-row gap-3">
              <UDropdownMenu
                :items="[{ label: 'Columnas visibles', type: 'label' }, ...columnDropdownItems]"
                :content="{ align: 'end' }"
                :ui="{ content: 'w-64' }"
              >
                <UButton
                  color="neutral"
                  icon="i-lucide-eye"
                  label="Columnas"
                  variant="subtle"
                />

                <template #item-leading="{ item }">
                  <span
                    class="size-2.5 shrink-0 rounded-full"
                    :style="{
                      backgroundColor: (item as KanbanColumnMenuItem)
                        .accentColor,
                    }"
                    aria-hidden="true"
                  />
                </template>
              </UDropdownMenu>

              <UFieldGroup>
                <UButton color="primary" icon="i-lucide-grid" variant="solid" />

                <UButton
                  color="neutral"
                  icon="i-lucide-list"
                  variant="subtle"
                />
              </UFieldGroup>

              <UButton
                icon="i-lucide-plus"
                label="Nueva solicitud"
                @click="rescueRequestModalRef?.openCreate()"
              />
            </div>
          </div>
        </div>

        <OperationalRescueRequestModal ref="rescueRequestModalRef" />

        <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div class="min-h-0 flex-1 overflow-x-auto overflow-y-hidden">
            <div class="flex h-full min-h-0 min-w-max gap-3 items-stretch">
              <OperationalKanbanColumn
                v-for="column in visibleColumns"
                :key="column.id"
                :title="column.title"
                :accent-color="column.accentColor"
                :items="column.id === 'requested' ? requestedColumnItems : []"
              >
                <template v-if="column.id === 'requested'" #default="{ item }">
                  <UCard>{{ item.id }}</UCard>
                </template>
              </OperationalKanbanColumn>
            </div>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
