<script setup lang="ts">
import { refDebounced } from '@vueuse/core';
import type { DropdownMenuItem } from '@nuxt/ui';
import {
  ADMINISTRATIVE_API_SERVICE_TYPES,
  ADMINISTRATIVE_ELIGIBLE_OPERATIVE_STATUSES,
  ADMINISTRATIVE_KANBAN_VISIBLE_COLUMNS,
  type AdministrativeBillingStatus,
  type AdministrativeEligibleOperativeStatus,
} from '~/constants/administrative-kanban';
import { RESCUE_SERVICE_TYPE_OPTIONS } from '~/constants/rescue-select-options';
import type { AdministrativeBoardFilters } from '~/interfaces/administrative/board-filters';
import type { AdministrativeRescueCard } from '~/interfaces/rescue/administrative';
import type { RescueServiceType } from '~/interfaces/rescue';

useHead({
  title: 'Administrativo',
});

const viewMode = ref<'kanban' | 'list'>('kanban');
const filtersExpanded = ref(false);
const detailModalMounted = ref(false);
const pendingDetailOpen = ref<{
  id: number;
  preview: AdministrativeRescueCard;
} | null>(null);

const detailModalRef = ref<{
  open: (id: number, preview?: AdministrativeRescueCard) => void;
} | null>(null);

function openRescueDetail(card: AdministrativeRescueCard) {
  if (detailModalMounted.value) {
    detailModalRef.value?.open(card.id, card);
    return;
  }
  pendingDetailOpen.value = { id: card.id, preview: card };
  detailModalMounted.value = true;
}

watch(detailModalRef, (modal) => {
  if (modal && pendingDetailOpen.value != null) {
    const pending = pendingDetailOpen.value;
    modal.open(pending.id, pending.preview);
    pendingDetailOpen.value = null;
  }
});

const folioSearch = ref('');
const debouncedFolio = refDebounced(folioSearch, 300);
const companyId = ref<number | null>(null);
const createdFrom = ref('');
const createdTo = ref('');
const selectedServiceTypes = ref<RescueServiceType[]>([]);
const selectedOperativeStatuses = ref<AdministrativeEligibleOperativeStatus[]>(
  [],
);
const selectedBillingStatuses = ref<AdministrativeBillingStatus[]>([]);
const managerId = ref<number | null>(null);
const sellerId = ref<number | null>(null);

const boardFilters = computed<AdministrativeBoardFilters>(() => ({
  folio: debouncedFolio.value,
  createdFrom: createdFrom.value,
  createdTo: createdTo.value,
  serviceTypes: selectedServiceTypes.value,
  operativeStatuses: selectedOperativeStatuses.value,
  billingStatuses: selectedBillingStatuses.value,
  companyId: companyId.value,
  managerId: managerId.value,
  sellerId: sellerId.value,
}));

const administrativeServiceTypeOptions = RESCUE_SERVICE_TYPE_OPTIONS.filter(
  (option) =>
    (ADMINISTRATIVE_API_SERVICE_TYPES as readonly string[]).includes(
      option.value,
    ),
);

const columnVisibility = ref<Record<string, boolean>>(
  Object.fromEntries(
    ADMINISTRATIVE_KANBAN_VISIBLE_COLUMNS.map((column) => [
      column.status,
      true,
    ]),
  ),
);

const visibleColumns = computed(() =>
  ADMINISTRATIVE_KANBAN_VISIBLE_COLUMNS.filter(
    (column) => columnVisibility.value[column.status],
  ),
);

const columnCounts = ref<Partial<Record<AdministrativeBillingStatus, number>>>(
  {},
);

function onColumnCount(
  status: AdministrativeBillingStatus,
  count: number,
) {
  columnCounts.value = { ...columnCounts.value, [status]: count };
}

type KanbanColumnMenuItem = DropdownMenuItem & {
  accentColor: string;
  columnStatus: string;
};

const columnDropdownItems = computed((): KanbanColumnMenuItem[] =>
  ADMINISTRATIVE_KANBAN_VISIBLE_COLUMNS.map((column) => ({
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

const {
  rows: listRows,
  asyncStatus: listAsyncStatus,
  hasNextPage: listHasNextPage,
  loadNextPage: listLoadNextPage,
  isInitialLoading: listInitialLoading,
  isLoadingMore: listLoadingMore,
  isError: listIsError,
  errorMessage: listErrorMessage,
  refresh: refreshList,
} = useAdministrativeRescueList(boardFilters, {
  enabled: () => viewMode.value === 'list',
});

const filteredListRows = computed(() =>
  filterAdministrativeCardsLocally(listRows.value, boardFilters.value),
);

const kanbanResultCount = computed(() =>
  visibleColumns.value.reduce(
    (sum, column) => sum + (columnCounts.value[column.status] ?? 0),
    0,
  ),
);

const resultCountLabel = computed(() => {
  const count =
    viewMode.value === 'list'
      ? filteredListRows.value.length
      : kanbanResultCount.value;
  return `${count} resultado${count === 1 ? '' : 's'}`;
});

const serviceTypeFilterItems = [
  { label: 'Todos', value: null as RescueServiceType | null },
  ...administrativeServiceTypeOptions.map((option) => ({
    label: option.label,
    value: option.value,
  })),
];

const selectedServiceTypeFilter = computed({
  get: () =>
    selectedServiceTypes.value.length === 1
      ? selectedServiceTypes.value[0]!
      : null,
  set: (value: RescueServiceType | null) => {
    selectedServiceTypes.value = value != null ? [value] : [];
  },
});

function clearFilters() {
  folioSearch.value = '';
  createdFrom.value = '';
  createdTo.value = '';
  selectedServiceTypes.value = [];
  selectedOperativeStatuses.value = [];
  selectedBillingStatuses.value = [];
  companyId.value = null;
  managerId.value = null;
  sellerId.value = null;
}

function exportCsv() {
  if (viewMode.value === 'list') {
    downloadAdministrativeCsv(filteredListRows.value);
    return;
  }
  viewMode.value = 'list';
  void refreshList().then(() => {
    downloadAdministrativeCsv(
      filterAdministrativeCardsLocally(listRows.value, boardFilters.value),
    );
  });
}

const {
  fetchAdministrativeCompanyDropdown,
  fetchAdministrativeManagerDropdown,
  fetchAdministrativeSellerDropdown,
} = useAdministrativeBoardDropdownFetchers();
</script>

<template>
  <UDashboardPanel
    :ui="{
      body: 'flex flex-col min-h-0 flex-1 overflow-hidden bg-elevated dark:bg-default',
    }"
  >
    <template #header>
      <SharedNavbar title="Administrativo" />
    </template>

    <template #body>
      <div class="flex min-h-0 flex-1 flex-col gap-4 p-4 sm:p-6">
        <div class="shrink-0 flex flex-col gap-3 rounded-lg border border-default bg-default p-4">
          <div class="flex flex-wrap items-center gap-3">
            <UButton
              color="neutral"
              :icon="filtersExpanded ? 'i-lucide-chevron-up' : 'i-lucide-sliders-horizontal'"
              label="Filtros"
              variant="subtle"
              @click="filtersExpanded = !filtersExpanded"
            />

            <UInput
              v-model="folioSearch"
              class="min-w-64 flex-1 max-w-md"
              leading-icon="i-lucide-search"
              placeholder="Buscar folio o cliente…"
            />

            <UButton
              color="neutral"
              label="Limpiar filtros"
              variant="link"
              @click="clearFilters"
            />

            <span class="text-sm text-muted whitespace-nowrap">
              {{ resultCountLabel }}
            </span>

            <div class="ml-auto flex flex-wrap items-center gap-2">
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
                <UButton
                  :color="viewMode === 'kanban' ? 'primary' : 'neutral'"
                  icon="i-lucide-grid"
                  :variant="viewMode === 'kanban' ? 'solid' : 'subtle'"
                  @click="viewMode = 'kanban'"
                />
                <UButton
                  :color="viewMode === 'list' ? 'primary' : 'neutral'"
                  icon="i-lucide-list"
                  :variant="viewMode === 'list' ? 'solid' : 'subtle'"
                  @click="viewMode = 'list'"
                />
              </UFieldGroup>

              <UButton
                color="neutral"
                icon="i-lucide-download"
                label="Exportar CSV"
                variant="subtle"
                @click="exportCsv"
              />
            </div>
          </div>

          <div
            v-show="filtersExpanded"
            class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 pt-3 border-t border-default"
          >
            <UFormField
              label="Desde"
              :ui="{ label: 'text-xs font-semibold uppercase tracking-wide text-muted' }"
            >
              <UInput
                v-model="createdFrom"
                class="w-full"
                type="date"
              />
            </UFormField>

            <UFormField
              label="Hasta"
              :ui="{ label: 'text-xs font-semibold uppercase tracking-wide text-muted' }"
            >
              <UInput
                v-model="createdTo"
                class="w-full"
                type="date"
              />
            </UFormField>

            <UFormField
              label="Tipo"
              :ui="{ label: 'text-xs font-semibold uppercase tracking-wide text-muted' }"
            >
              <USelect
                v-model="selectedServiceTypeFilter"
                class="w-full"
                :items="serviceTypeFilterItems"
                value-key="value"
                label-key="label"
                placeholder="Todos"
              />
            </UFormField>

            <UFormField
              label="Estatus op."
              :ui="{ label: 'text-xs font-semibold uppercase tracking-wide text-muted' }"
            >
              <USelectMenu
                v-model="selectedOperativeStatuses"
                class="w-full"
                multiple
                :items="[
                  ...ADMINISTRATIVE_ELIGIBLE_OPERATIVE_STATUSES.map((status) => ({
                    label: getAdministrativeOperativeStatusLabel(status),
                    value: status,
                  })),
                ]"
                value-key="value"
                label-key="label"
                placeholder="Todos"
              />
            </UFormField>

            <UFormField
              label="Estatus admin."
              :ui="{ label: 'text-xs font-semibold uppercase tracking-wide text-muted' }"
            >
              <USelectMenu
                v-model="selectedBillingStatuses"
                class="w-full"
                multiple
                :items="[
                  ...ADMINISTRATIVE_KANBAN_VISIBLE_COLUMNS.map((column) => ({
                    label: column.title,
                    value: column.status,
                  })),
                ]"
                value-key="value"
                label-key="label"
                placeholder="Todos"
              />
            </UFormField>

            <UFormField
              label="Gestor"
              :ui="{ label: 'text-xs font-semibold uppercase tracking-wide text-muted' }"
            >
              <CatalogDropdownSelect
                v-model="managerId"
                class="w-full"
                placeholder="Todos"
                :fetcher="fetchAdministrativeManagerDropdown"
              />
            </UFormField>

            <UFormField
              label="Vendedor"
              :ui="{ label: 'text-xs font-semibold uppercase tracking-wide text-muted' }"
            >
              <CatalogDropdownSelect
                v-model="sellerId"
                class="w-full"
                placeholder="Todos"
                :fetcher="fetchAdministrativeSellerDropdown"
              />
            </UFormField>

            <UFormField
              label="Compañía"
              class="sm:col-span-2 lg:col-span-3"
              :ui="{ label: 'text-xs font-semibold uppercase tracking-wide text-muted' }"
            >
              <CatalogDropdownSelect
                v-model="companyId"
                class="w-full"
                placeholder="Todas"
                :fetcher="fetchAdministrativeCompanyDropdown"
              />
            </UFormField>
          </div>
        </div>

        <LazyAdministrativeRescueDetailModal
          v-if="detailModalMounted"
          ref="detailModalRef"
        />

        <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div
            v-if="viewMode === 'kanban'"
            class="min-h-0 flex-1 overflow-x-auto overflow-y-hidden rounded-lg"
          >
            <div class="flex h-full min-h-0 min-w-max gap-3 items-stretch p-1">
              <LazyAdministrativeKanbanColumnData
                v-for="column in visibleColumns"
                :key="column.status"
                hydrate-on-visible
                :status="column.status"
                :title="column.title"
                :accent-color="column.accentColor"
                :filters="boardFilters"
                @count="onColumnCount"
                @select="openRescueDetail"
              />
            </div>
          </div>

          <div
            v-else
            class="min-h-0 flex-1 overflow-auto"
          >
            <UAlert
              v-if="listIsError"
              class="mb-4"
              color="error"
              :description="listErrorMessage"
              title="No se pudo cargar la lista"
            />
            <AdministrativeRescueTable
              :async-status="listAsyncStatus"
              :has-next-page="listHasNextPage"
              :loading="listInitialLoading || listLoadingMore"
              :load-next-page="listLoadNextPage"
              :rows="filteredListRows"
              @select="openRescueDetail"
            />
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
