<script setup lang="ts">
import { refDebounced } from '@vueuse/core';
import type { DropdownMenuItem } from '@nuxt/ui';

import { OPERATIONAL_KANBAN_COLUMNS } from '~/constants/operational-kanban';
import { RESCUE_SERVICE_TYPE_OPTIONS } from '~/constants/rescue-select-options';
import type { RescueServiceType } from '~/interfaces/rescue';
import type { OperationalBoardFilters } from '~/interfaces/operational/board-filters';

const rescueRequestModalRef = ref<{
  openCreate: () => void;
} | null>(null);

const rescueDetailModalRef = ref<{
  open: (id: number) => void;
} | null>(null);

function openRescueDetail(id: number) {
  rescueDetailModalRef.value?.open(id);
}

const columnVisibility = ref<Record<string, boolean>>(
  Object.fromEntries(
    OPERATIONAL_KANBAN_COLUMNS.map((column) => [column.status, true]),
  ),
);

const visibleColumns = computed(() =>
  OPERATIONAL_KANBAN_COLUMNS.filter(
    (column) => columnVisibility.value[column.status],
  ),
);

type KanbanColumnMenuItem = DropdownMenuItem & {
  accentColor: string;
  columnStatus: string;
};

const columnDropdownItems = computed((): KanbanColumnMenuItem[] =>
  OPERATIONAL_KANBAN_COLUMNS.map((column) => ({
    label: column.title,
    type: 'checkbox' as const,
    columnStatus: column.status,
    accentColor: column.accentColor,
    checked: columnVisibility.value[column.status] ?? true,
    onUpdateChecked(checked: boolean) {
      columnVisibility.value[column.status] = checked;
    },
    onSelect(e: Event) {
      e.preventDefault();
    },
  })),
);

const folioSearch = ref('');
const debouncedFolio = refDebounced(folioSearch, 300);
const selectedServiceTypes = ref<RescueServiceType[]>([]);
const companyId = ref<number | null>(null);
const managerId = ref<number | null>(null);

const boardFilters = computed<OperationalBoardFilters>(() => ({
  folio: debouncedFolio.value,
  serviceTypes: selectedServiceTypes.value,
  companyId: companyId.value,
  managerId: managerId.value,
}));

function clearServiceTypeFilters() {
  selectedServiceTypes.value = [];
}

function toggleServiceType(value: RescueServiceType) {
  selectedServiceTypes.value = toggleOperationalServiceTypeFilter(
    selectedServiceTypes.value,
    value,
  );
}

function isServiceTypeSelected(value: RescueServiceType) {
  return isOperationalServiceTypeActive(selectedServiceTypes.value, value);
}

const { fetchOperationalCompanyDropdown, fetchOperationalManagerDropdown } =
  useOperationalBoardDropdownFetchers();
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
                v-model="folioSearch"
                leading-icon="i-lucide-search"
                placeholder="Buscar folio"
                class="min-w-48"
              />

              <UFieldGroup>
                <UButton
                  :color="
                    selectedServiceTypes.length === 0 ? 'primary' : 'neutral'
                  "
                  label="Todos"
                  :variant="
                    selectedServiceTypes.length === 0 ? 'solid' : 'subtle'
                  "
                  @click="clearServiceTypeFilters"
                />

                <UButton
                  v-for="option in RESCUE_SERVICE_TYPE_OPTIONS"
                  :key="option.value"
                  :color="
                    isServiceTypeSelected(option.value) ? 'primary' : 'neutral'
                  "
                  :label="option.label"
                  :variant="
                    isServiceTypeSelected(option.value) ? 'solid' : 'subtle'
                  "
                  @click="toggleServiceType(option.value)"
                />
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
              <USlideover title="Filtros">
                <UButton
                  icon="i-lucide-filter"
                  color="neutral"
                  label="Mas filtros"
                  variant="subtle"
                />

                <template #body>
                  <div class="flex flex-col gap-3">
                    <CatalogDropdownSelect
                      v-model="companyId"
                      class="min-w-52"
                      placeholder="Compañía: todas"
                      :fetcher="fetchOperationalCompanyDropdown"
                    />

                    <CatalogDropdownSelect
                      v-model="managerId"
                      class="min-w-52"
                      placeholder="Gestor: todos"
                      :fetcher="fetchOperationalManagerDropdown"
                    />
                  </div>
                </template>
              </USlideover>
              <UDropdownMenu
                :items="[
                  { label: 'Columnas visibles', type: 'label' },
                  ...columnDropdownItems,
                ]"
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
        <OperationalRescueDetailModal ref="rescueDetailModalRef" />

        <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div class="min-h-0 flex-1 overflow-x-auto overflow-y-hidden">
            <div class="flex h-full min-h-0 min-w-max gap-3 items-stretch">
              <OperationalKanbanColumnData
                v-for="column in visibleColumns"
                :key="column.status"
                :status="column.status"
                :title="column.title"
                :accent-color="column.accentColor"
                :filters="boardFilters"
                @select="openRescueDetail"
              />
            </div>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
