<script setup lang="ts">
import { refDebounced } from '@vueuse/core';
import type { DropdownMenuItem } from '@nuxt/ui';

import { OPERATIONAL_KANBAN_COLUMNS } from '~/constants/operational-kanban';
import type { OperationalRescueStatus } from '~/constants/operational-kanban';
import { RESCUE_SERVICE_TYPE_OPTIONS } from '~/constants/rescue-select-options';
import type { RescueCard, RescueServiceType  } from '~/interfaces/rescue';

import type { OperationalBoardFilters } from '~/interfaces/operational/board-filters';
import { emptyCatalogDropdownSelection } from '~/interfaces/shared/catalog-dropdown.interface';

useHead({
  title: 'Operacional',
});

const { viewMode, setViewMode } = useRescueBoardViewMode();

const requestModalMounted = ref(false);
const detailModalMounted = ref(false);
const pendingOpenCreate = ref(false);
const pendingDetailId = ref<number | null>(null);

const rescueRequestModalRef = ref<{
  openCreate: () => void;
} | null>(null);

const rescueDetailModalRef = ref<{
  open: (id: number) => void;
  close: () => void;
} | null>(null);

function ensureDetailModalMounted() {
  detailModalMounted.value = true;
}

const { openRescue, onModalClosed } = useRescueDetailRouteQuery({
  getModalRef: () => rescueDetailModalRef.value,
  ensureMounted: ensureDetailModalMounted,
  openModal: (id) => rescueDetailModalRef.value?.open(id),
  pendingId: pendingDetailId,
});

function openCreateRequest() {
  if (requestModalMounted.value) {
    rescueRequestModalRef.value?.openCreate();
    return;
  }
  pendingOpenCreate.value = true;
  requestModalMounted.value = true;
}

watch(rescueRequestModalRef, (modal) => {
  if (modal && pendingOpenCreate.value) {
    modal.openCreate();
    pendingOpenCreate.value = false;
  }
});

watch(rescueDetailModalRef, (modal) => {
  if (modal && pendingDetailId.value != null) {
    modal.open(pendingDetailId.value);
    pendingDetailId.value = null;
  }
});

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
const selectedOperativeStatus = ref<OperationalRescueStatus | null>(null);
const company = ref(emptyCatalogDropdownSelection());
const manager = ref(emptyCatalogDropdownSelection());
const client = ref(emptyCatalogDropdownSelection());
const pendingAdvance = ref(false);
const slaAlert = ref(false);
const commentAlert = ref(false);

const boardFilters = computed<OperationalBoardFilters>(() => ({
  folio: debouncedFolio.value,
  serviceTypes: selectedServiceTypes.value,
  operativeStatus: selectedOperativeStatus.value,
  company: company.value,
  manager: manager.value,
  client: client.value,
  pendingAdvance: pendingAdvance.value,
  slaAlert: slaAlert.value,
  commentAlert: commentAlert.value,
}));

const {
  rows: listRows,
  asyncStatus: listAsyncStatus,
  hasNextPage: listHasNextPage,
  loadNextPage: listLoadNextPage,
  isInitialLoading: listInitialLoading,
  isLoadingMore: listLoadingMore,
  isError: listIsError,
  errorMessage: listErrorMessage,
} = useOperationalRescueList(boardFilters, {
  enabled: () => viewMode.value === 'list',
});

const resultCountLabel = computed(() => {
  const count = listRows.value.length;
  return `${count} resultado${count === 1 ? '' : 's'}`;
});

function openRescueFromList(card: RescueCard) {
  openRescue(card.id);
}

function clearBoardFilters() {
  folioSearch.value = '';
  selectedServiceTypes.value = [];
  selectedOperativeStatus.value = null;
  company.value = emptyCatalogDropdownSelection();
  manager.value = emptyCatalogDropdownSelection();
  client.value = emptyCatalogDropdownSelection();
  pendingAdvance.value = false;
  slaAlert.value = false;
  commentAlert.value = false;
}

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

const operativeStatusFilterItems = [
  { label: 'Todos', value: null as OperationalRescueStatus | null },
  ...OPERATIONAL_KANBAN_COLUMNS.map((column) => ({
    label: column.title,
    value: column.status,
  })),
];

const {
  fetchOperationalCompanyDropdown,
  fetchOperationalClientDropdown,
  fetchOperationalManagerDropdown,
} = useOperationalBoardDropdownFetchers();
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
        <div class="mb-2 shrink-0">
          <SharedMobileFilterBar slideover-title="Filtros operacionales">
            <template #primary>
              <UInput
                v-model="folioSearch"
                class="w-full min-w-0"
                leading-icon="i-lucide-search"
                placeholder="Buscar folio"
              />
            </template>

            <template #actions>
              <span
                v-if="viewMode === 'list'"
                class="text-sm text-muted whitespace-nowrap"
              >
                {{ resultCountLabel }}
              </span>

              <UFieldGroup class="hidden sm:flex">
                <UButton
                  :color="viewMode === 'kanban' ? 'primary' : 'neutral'"
                  icon="i-lucide-grid"
                  :variant="viewMode === 'kanban' ? 'solid' : 'subtle'"
                  aria-label="Vista kanban"
                  @click="setViewMode('kanban')"
                />
                <UButton
                  :color="viewMode === 'list' ? 'primary' : 'neutral'"
                  icon="i-lucide-list"
                  :variant="viewMode === 'list' ? 'solid' : 'subtle'"
                  aria-label="Vista lista"
                  @click="setViewMode('list')"
                />
              </UFieldGroup>

              <UButton
                icon="i-lucide-plus"
                label="Nueva solicitud"
                @click="openCreateRequest()"
              />
            </template>

            <template #filters>
              <UButton
                block
                color="neutral"
                label="Limpiar filtros"
                variant="link"
                @click="clearBoardFilters"
              />

              <UFieldGroup class="w-full">
                <UButton
                  block
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
                  block
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
                v-if="viewMode === 'kanban'"
                block
                :color="pendingAdvance ? 'primary' : 'neutral'"
                label="Con anticipo pendiente"
                :variant="pendingAdvance ? 'solid' : 'subtle'"
                @click="() => { pendingAdvance = !pendingAdvance }"
              />

              <UFieldGroup
                v-if="viewMode === 'kanban'"
                class="w-full"
              >
                <UButton
                  block
                  :color="slaAlert ? 'primary' : 'neutral'"
                  label="Alerta SLA"
                  :variant="slaAlert ? 'solid' : 'subtle'"
                  @click="() => { slaAlert = !slaAlert }"
                />

                <UButton
                  block
                  :color="commentAlert ? 'primary' : 'neutral'"
                  label="Alerta actualización"
                  :variant="commentAlert ? 'solid' : 'subtle'"
                  @click="() => { commentAlert = !commentAlert }"
                />
              </UFieldGroup>

              <UFormField
                v-if="viewMode === 'list'"
                label="Estatus operativo"
                :ui="{ label: 'text-xs font-semibold uppercase tracking-wide text-muted' }"
              >
                <USelect
                  v-model="selectedOperativeStatus"
                  class="w-full"
                  :items="operativeStatusFilterItems"
                  value-key="value"
                  label-key="label"
                  placeholder="Todos"
                />
              </UFormField>

              <CatalogDropdownSelect
                v-model="company"
                class="w-full"
                placeholder="Compañía: todas"
                :fetcher="fetchOperationalCompanyDropdown"
              />

              <CatalogDropdownSelect
                v-model="client"
                class="w-full"
                placeholder="Cliente: todos"
                :fetcher="fetchOperationalClientDropdown"
              />

              <CatalogDropdownSelect
                v-model="manager"
                class="w-full"
                placeholder="Gestor: todos"
                :fetcher="fetchOperationalManagerDropdown"
              />

              <UDropdownMenu
                v-if="viewMode === 'kanban'"
                :items="[
                  { label: 'Columnas visibles', type: 'label' },
                  ...columnDropdownItems,
                ]"
                :content="{ align: 'end' }"
                :ui="{ content: 'w-64' }"
              >
                <UButton
                  block
                  color="neutral"
                  icon="i-lucide-eye"
                  label="Columnas visibles"
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
            </template>

            <div class="flex flex-wrap items-center justify-between gap-3">
              <div class="flex min-w-0 flex-1 flex-row flex-wrap gap-3">
                <UInput
                  v-model="folioSearch"
                  class="w-full min-w-0 sm:min-w-64 sm:max-w-xs"
                  leading-icon="i-lucide-search"
                  placeholder="Buscar folio"
                />

                <UButton
                  color="neutral"
                  label="Limpiar filtros"
                  variant="link"
                  @click="clearBoardFilters"
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
                  v-if="viewMode === 'kanban'"
                  :color="pendingAdvance ? 'primary' : 'neutral'"
                  label="Con anticipo pendiente"
                  :variant="pendingAdvance ? 'solid' : 'subtle'"
                  @click="() => { pendingAdvance = !pendingAdvance }"
                />

                <UFieldGroup v-if="viewMode === 'kanban'">
                  <UButton
                    :color="slaAlert ? 'primary' : 'neutral'"
                    label="Alerta SLA"
                    :variant="slaAlert ? 'solid' : 'subtle'"
                    @click="() => { slaAlert = !slaAlert }"
                  />

                  <UButton
                    :color="commentAlert ? 'primary' : 'neutral'"
                    label="Alerta actualización"
                    :variant="commentAlert ? 'solid' : 'subtle'"
                    @click="() => { commentAlert = !commentAlert }"
                  />
                </UFieldGroup>

                <USelect
                  v-if="viewMode === 'list'"
                  v-model="selectedOperativeStatus"
                  class="min-w-48"
                  :items="operativeStatusFilterItems"
                  value-key="value"
                  label-key="label"
                  placeholder="Estatus: todos"
                />

                <div class="relative hidden lg:inline-flex">
                  <UFieldGroup
                    class="pointer-events-none select-none blur-[2px] opacity-60"
                    aria-hidden="true"
                  >
                    <UButton
                      color="neutral"
                      label="Agente: todos"
                      variant="solid"
                      tabindex="-1"
                    />

                    <UButton
                      color="neutral"
                      label="Trabajando"
                      variant="subtle"
                      tabindex="-1"
                    />

                    <UButton
                      color="neutral"
                      label="Requiere humano"
                      variant="subtle"
                      tabindex="-1"
                    />
                  </UFieldGroup>

                  <div
                    class="absolute inset-0 z-10 flex items-center justify-center rounded-lg"
                    aria-label="Próximamente"
                  >
                    <span
                      class="rounded-full border border-default bg-elevated/95 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted shadow-sm backdrop-blur-sm"
                    >
                      Próximamente
                    </span>
                  </div>
                </div>
              </div>

              <div class="ml-auto flex flex-row flex-wrap gap-3">
                <span
                  v-if="viewMode === 'list'"
                  class="hidden text-sm text-muted whitespace-nowrap sm:inline"
                >
                  {{ resultCountLabel }}
                </span>

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
                        v-model="company"
                        class="w-full"
                        placeholder="Compañía: todas"
                        :fetcher="fetchOperationalCompanyDropdown"
                      />

                      <CatalogDropdownSelect
                        v-model="client"
                        class="w-full"
                        placeholder="Cliente: todos"
                        :fetcher="fetchOperationalClientDropdown"
                      />

                      <CatalogDropdownSelect
                        v-model="manager"
                        class="w-full"
                        placeholder="Gestor: todos"
                        :fetcher="fetchOperationalManagerDropdown"
                      />
                    </div>
                  </template>
                </USlideover>

                <UDropdownMenu
                  v-if="viewMode === 'kanban'"
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

                <UFieldGroup class="hidden sm:flex">
                  <UButton
                    :color="viewMode === 'kanban' ? 'primary' : 'neutral'"
                    icon="i-lucide-grid"
                    :variant="viewMode === 'kanban' ? 'solid' : 'subtle'"
                    aria-label="Vista kanban"
                    @click="setViewMode('kanban')"
                  />

                  <UButton
                    :color="viewMode === 'list' ? 'primary' : 'neutral'"
                    icon="i-lucide-list"
                    :variant="viewMode === 'list' ? 'solid' : 'subtle'"
                    aria-label="Vista lista"
                    @click="setViewMode('list')"
                  />
                </UFieldGroup>

                <UButton
                  icon="i-lucide-plus"
                  label="Nueva solicitud"
                  @click="openCreateRequest()"
                />
              </div>
            </div>
          </SharedMobileFilterBar>
        </div>

        <LazyOperationalRescueRequestModal
          v-if="requestModalMounted"
          ref="rescueRequestModalRef"
        />
        <LazyOperationalRescueDetailModal
          v-if="detailModalMounted"
          ref="rescueDetailModalRef"
          @closed="onModalClosed"
        />

        <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
          <SharedKanbanScrollContainer v-if="viewMode === 'kanban'">
            <LazyOperationalKanbanColumnData
              v-for="column in visibleColumns"
              :key="column.status"
              hydrate-on-visible
              :status="column.status"
              :title="column.title"
              :accent-color="column.accentColor"
              :filters="boardFilters"
              @select="openRescue"
            />
          </SharedKanbanScrollContainer>

          <div
            v-else
            class="flex min-h-0 flex-1 flex-col overflow-hidden"
          >
            <UAlert
              v-if="listIsError"
              class="mb-4 shrink-0"
              color="error"
              :description="listErrorMessage"
              title="No se pudo cargar la lista"
            />
            <LazyOperationalRescueTable
              class="min-h-0 flex-1"
              :async-status="listAsyncStatus"
              :has-next-page="listHasNextPage"
              :loading="listInitialLoading || listLoadingMore"
              :load-next-page="listLoadNextPage"
              :rows="listRows"
              @select="openRescueFromList"
            />
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
