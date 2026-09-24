<script setup lang="ts">
import { h, resolveComponent } from 'vue';
import { useMediaQuery } from '@vueuse/core';
import {
  PENDING_INVOICE_SEARCH_PLACEHOLDER,
  pendingInvoiceDetailColumns,
  type PendingInvoiceColumnId,
} from '~/constants/pending-invoice';

/**
 * Detalle de Por Facturar del portal de cliente. En desktop muestra la tabla
 * con filtros por columna; en móvil, tarjetas con orden rápido y los filtros
 * generales (slot `filters`) dentro de un drawer.
 */
const {
  isInitialLoading,
  isLoadingMore,
  isError,
  errorMessage,
  asyncStatus,
  hasNextPage,
  loadNextPage,
  refresh,
  startDate,
  endDate,
  applyOrdering,
  summary,
  isSummaryLoading,
  isSummaryError,
  controller,
  search,
  downloadingEvidenceKey,
  processingOcRowId,
  searchedRows,
  rows,
  activeFilterCount,
  filtering,
  commentRow,
  isCommentOpen,
  sendAdminDocModalOpen,
  pendingAdminDocRow,
  isSavingAdminDoc,
  openComments,
  openAdminDoc,
  onSendAdminDocSubmit,
  onClearFilters,
  onEvidenceZip,
} = usePendingInvoiceDetailView();

const UInput = resolveComponent('UInput');
const UButton = resolveComponent('UButton');

const reportScope = usePendingReportScope();
const { appliedClientIds } = useClientPortalClientFilter();

const isDesktop = useMediaQuery('(min-width: 1024px)');
const isFiltersOpen = ref(false);

/** Filtros generales activos (cliente + fechas), para el badge del botón móvil. */
const generalFilterCount = computed(
  () =>
    (appliedClientIds.value.length > 0 ? 1 : 0)
    + (isPendingInvoiceDefaultDateRange(startDate.value, endDate.value) ? 0 : 1),
);
const mobileFilterCount = computed(
  () => generalFilterCount.value + activeFilterCount.value,
);

const countLabel = computed(() => {
  if (isSummaryLoading.value) return 'Cargando…';
  // Sin summary, al menos lo que ya está cargado en pantalla.
  if (isSummaryError.value) {
    const loaded = rows.value.length.toLocaleString('es-MX');
    return `${loaded}${hasNextPage.value ? '+' : ''} eventos`;
  }
  const count = summary.value.count;
  return `${count.toLocaleString('es-MX')} evento${count === 1 ? '' : 's'}`;
});

/** El mismo buscador vive en la barra de filtros (desktop) o sobre las tarjetas (móvil). */
const SearchField = defineComponent(() => () =>
  h(
    UInput,
    {
      modelValue: search.value,
      'onUpdate:modelValue': (value: string) => {
        search.value = value;
      },
      icon: 'i-lucide-search',
      class: 'w-full min-w-0 flex-1',
      placeholder: isDesktop.value
        ? PENDING_INVOICE_SEARCH_PLACEHOLDER
        : 'Buscar folio, unidad…',
      ui: { base: 'bg-default' },
    },
    search.value
      ? {
          trailing: () =>
            h(UButton, {
              color: 'neutral',
              variant: 'link',
              size: 'xs',
              icon: 'i-lucide-x',
              'aria-label': 'Limpiar búsqueda',
              onClick: () => {
                search.value = '';
              },
            }),
        }
      : undefined,
  ),
);

type SortKey = `${'dias' | 'total'}:${'asc' | 'desc'}`;

const SORT_ITEMS: { label: string; value: SortKey; icon: string }[] = [
  { label: 'Más antiguos primero', value: 'dias:desc', icon: 'i-lucide-hourglass' },
  { label: 'Más recientes primero', value: 'dias:asc', icon: 'i-lucide-calendar-clock' },
  { label: 'Mayor total', value: 'total:desc', icon: 'i-lucide-arrow-down-wide-narrow' },
  { label: 'Menor total', value: 'total:asc', icon: 'i-lucide-arrow-up-narrow-wide' },
];

const sortKey = computed<SortKey | undefined>({
  get: () => {
    const column = controller.sortColumn.value;
    if (column !== 'dias' && column !== 'total') return undefined;
    const direction = controller.sortDescending.value ? 'desc' : 'asc';
    return `${column}:${direction}` as SortKey;
  },
  set: (value: SortKey | undefined) => {
    if (!value) return;
    const [column, direction] = value.split(':') as [PendingInvoiceColumnId, 'asc' | 'desc'];
    const meta = pendingInvoiceDetailColumns(reportScope.value).find(
      item => item.id === column,
    );
    if (!meta) return;
    const descending = direction === 'desc';
    controller.applySort(column, descending);
    applyOrdering(meta, descending);
  },
});
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col gap-3">
    <!-- Filtros generales: barra en desktop -->
    <div
      v-if="isDesktop"
      class="flex flex-wrap items-start gap-x-6 gap-y-3 rounded-xl border border-default bg-default p-4"
    >
      <slot name="filters" />

      <div class="ms-auto flex min-w-56 max-w-96 flex-1 flex-col gap-1">
        <p class="text-[11px] font-medium uppercase tracking-wider text-muted">
          Buscar
        </p>
        <SearchField />
      </div>
    </div>

    <PendingInvoiceTableFullscreenSection>
      <template #toolbar="{ isFullscreen, toggle }">
        <div class="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div
            v-if="!isDesktop"
            class="flex items-center gap-2"
          >
            <SearchField />

            <UButton
              color="neutral"
              variant="outline"
              icon="i-lucide-sliders-horizontal"
              :label="mobileFilterCount > 0 ? `Filtros · ${mobileFilterCount}` : 'Filtros'"
              class="shrink-0 bg-default"
              @click="isFiltersOpen = true"
            />
          </div>

          <div class="flex items-center gap-2 lg:ms-auto">
            <USelect
              v-if="!isDesktop"
              v-model="sortKey"
              :items="SORT_ITEMS"
              placeholder="Ordenar"
              icon="i-lucide-arrow-up-down"
              size="sm"
              variant="ghost"
              class="-ms-2"
            />

            <UButton
              v-if="activeFilterCount > 0"
              color="neutral"
              variant="ghost"
              size="sm"
              icon="i-lucide-filter-x"
              :label="isDesktop ? `Limpiar filtros de columna (${activeFilterCount})` : 'Limpiar'"
              @click="onClearFilters"
            />

            <p class="ms-auto whitespace-nowrap text-sm text-muted tabular-nums lg:ms-0">
              {{ countLabel }}
            </p>

            <UButton
              v-if="isDesktop"
              color="neutral"
              variant="ghost"
              size="sm"
              :icon="isFullscreen ? 'i-lucide-minimize-2' : 'i-lucide-maximize-2'"
              :aria-label="isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'"
              :title="isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'"
              @click="toggle"
            />
          </div>
        </div>
      </template>

      <div
        v-if="isInitialLoading"
        class="flex flex-col gap-2"
      >
        <USkeleton
          v-for="index in 6"
          :key="index"
          class="h-14 w-full rounded-xl"
        />
      </div>

      <div
        v-else-if="isError && rows.length === 0"
        class="flex min-h-48 flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-default bg-default p-6 text-center"
      >
        <UIcon
          name="i-lucide-cloud-off"
          class="size-8 text-dimmed"
        />
        <p class="text-sm text-muted">
          {{ errorMessage || 'No se pudo cargar Por Facturar.' }}
        </p>
        <UButton
          color="neutral"
          variant="subtle"
          icon="i-lucide-refresh-cw"
          label="Reintentar"
          @click="() => void refresh()"
        />
      </div>

      <template v-else>
        <ClientPortalPendingInvoiceTable
          v-if="isDesktop"
          :rows="rows"
          :option-rows="searchedRows"
          :controller="controller"
          :downloading-evidence-key="downloadingEvidenceKey"
          :processing-oc-row-id="processingOcRowId"
          :has-next-page="hasNextPage"
          :load-next-page="loadNextPage"
          :async-status="asyncStatus"
          :filtering="filtering"
          @comment="openComments"
          @admin-doc="openAdminDoc"
          @evidence-zip="onEvidenceZip"
        />

        <ClientPortalPendingInvoiceCards
          v-else
          :rows="rows"
          :downloading-evidence-key="downloadingEvidenceKey"
          :processing-oc-row-id="processingOcRowId"
          :has-next-page="hasNextPage"
          :load-next-page="loadNextPage"
          :async-status="asyncStatus"
          @comment="openComments"
          @admin-doc="openAdminDoc"
          @evidence-zip="onEvidenceZip"
        />

        <p
          v-if="isLoadingMore"
          class="flex items-center justify-center gap-2 py-1 text-xs text-muted"
        >
          <UIcon
            name="i-lucide-loader-circle"
            class="size-3.5 animate-spin"
          />
          Cargando más eventos…
        </p>
      </template>
    </PendingInvoiceTableFullscreenSection>

    <!-- Filtros generales: drawer en móvil -->
    <UDrawer
      v-if="!isDesktop"
      v-model:open="isFiltersOpen"
      title="Filtros"
      description="Acota los eventos por cliente y rango de fechas."
      :ui="{ body: 'flex flex-col gap-5 pb-2' }"
    >
      <template #body>
        <slot name="filters" />
      </template>
      <template #footer>
        <UButton
          block
          size="lg"
          label="Ver resultados"
          @click="isFiltersOpen = false"
        />
      </template>
    </UDrawer>

    <LazyPendingInvoiceCommentModal
      v-model:open="isCommentOpen"
      :row="commentRow"
    />

    <LazyAdministrativeSendAdminDocModal
      v-if="sendAdminDocModalOpen && pendingAdminDocRow"
      v-model:open="sendAdminDocModalOpen"
      :source-rescue-id="pendingAdminDocRow.id"
      :remittance-folio="pendingAdminDocRow.oc ?? ''"
      :invoice-folio="pendingAdminDocRow.factura ?? ''"
      :oc-pdf="pendingAdminDocRow.oc_pdf ?? ''"
      :allow-extra-rescues="false"
      :editable-folios="true"
      :show-invoice-folio="false"
      :loading="isSavingAdminDoc"
      @submit="onSendAdminDocSubmit"
    />
  </div>
</template>
