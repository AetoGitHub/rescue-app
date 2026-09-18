<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui';
import type { TmsRescue } from '~/interfaces/portals/tms';
import { adminListTableClass } from '~/constants/admin-list-layout';
import { refDebounced } from '@vueuse/core';

useHead({ title: 'Portal TMS · Completadas' });

const search = ref('');
const debouncedSearch = refDebounced(search, 300);
const tableRef = useTemplateRef('table');

const {
  rows,
  asyncStatus,
  hasNextPage,
  loadNextPage,
  isInitialLoading,
  isError,
  errorMessage,
  refresh,
} = useTmsCompletedRescueList(debouncedSearch);

usePaginatedTableInfiniteScroll({
  tableRef,
  hasNextPage,
  loadNextPage,
  asyncStatus,
});

const isRefreshing = ref(false);
async function onRefreshClick() {
  if (isRefreshing.value) return;
  isRefreshing.value = true;
  try {
    await refresh();
  } finally {
    isRefreshing.value = false;
  }
}

function columnWidth(width: string) {
  return { class: { th: width, td: `${width} align-top` } };
}

const columns: TableColumn<TmsRescue>[] = [
  { accessorKey: 'id', header: 'ID', meta: columnWidth('w-12') },
  { accessorKey: 'folio', header: 'Folio', meta: columnWidth('w-36') },
  {
    accessorKey: 'remittance_folio',
    header: 'Orden de compra',
    meta: columnWidth('w-28'),
  },
  {
    accessorKey: 'invoice_folio',
    header: 'Factura',
    meta: columnWidth('w-28'),
  },
  { accessorKey: 'oc_pdf', header: 'PDF OC', meta: columnWidth('w-28') },
  {
    accessorKey: 'internal_notes',
    header: 'Notas internas',
    meta: { class: { td: 'align-top' } },
  },
  { accessorKey: 'origen', header: 'Origen', meta: columnWidth('w-40') },
];

const tableUi = {
  root: '[scrollbar-gutter:stable]',
  base: 'w-full table-fixed',
  th: 'px-2.5 py-2 whitespace-normal',
  td: 'px-2.5 py-2 whitespace-normal',
} as const;
</script>

<template>
  <AdminListPageShell
    fluid
    navbar-title="Portal TMS"
    title="TMS · Completadas"
    description="Rescates cuya orden de compra ya quedó subida, por automatización o a mano."
  >
    <template #actions>
      <UButton
        color="neutral"
        variant="subtle"
        icon="i-lucide-refresh-cw"
        label="Actualizar"
        :loading="isRefreshing"
        :disabled="isRefreshing"
        @click="onRefreshClick"
      />
    </template>

    <template #filters>
      <UInput
        v-model="search"
        leading-icon="i-lucide-search"
        placeholder="Buscar folio"
        class="w-full sm:max-w-md"
        variant="subtle"
        :ui="{ base: 'bg-default' }"
      />
    </template>

    <div
      v-if="isInitialLoading"
      class="flex min-h-48 flex-1 items-center justify-center"
    >
      <UIcon
        name="i-lucide-loader-circle"
        class="size-7 animate-spin text-muted"
      />
    </div>

    <div
      v-else-if="isError && rows.length === 0"
      class="flex min-h-48 flex-1 flex-col items-center justify-center gap-3 text-center"
    >
      <UIcon name="i-lucide-cloud-alert" class="size-8 text-muted" />
      <p class="text-sm text-muted">
        {{ errorMessage || 'No se pudo cargar el historial de completadas.' }}
      </p>
      <UButton
        color="neutral"
        variant="subtle"
        icon="i-lucide-refresh-cw"
        label="Reintentar"
        @click="() => void refresh()"
      />
    </div>

    <SharedResponsiveDataList v-else>
      <template #cards>
        <div
          v-if="rows.length === 0"
          class="rounded-lg border border-dashed border-default p-8 text-center text-sm text-muted"
        >
          No hay rescates completados que coincidan con la búsqueda.
        </div>

        <article
          v-for="rescue in rows"
          :key="rescue.id"
          class="rounded-lg border border-default bg-default p-4"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <h2 class="font-semibold text-highlighted">
                {{ rescue.folio }}
              </h2>
              <p class="mt-1 text-xs text-muted">ID {{ rescue.id }}</p>
            </div>
            <UBadge
              :color="describeTmsUploadOrigin(rescue).color"
              variant="subtle"
              size="sm"
              :icon="describeTmsUploadOrigin(rescue).icon"
              :label="describeTmsUploadOrigin(rescue).label"
            />
          </div>

          <div class="mt-3 flex flex-wrap items-center gap-1.5">
            <UBadge
              v-if="rescue.remittance_folio"
              color="neutral"
              variant="subtle"
              size="sm"
              :label="`OC ${rescue.remittance_folio}`"
            />
            <PortalTmsMissingValue v-else label="Sin orden" />
            <UBadge
              v-if="rescue.invoice_folio"
              color="neutral"
              variant="subtle"
              size="sm"
              :label="`Factura ${rescue.invoice_folio}`"
            />
            <PortalTmsMissingValue v-else label="Sin factura" />
          </div>

          <div class="mt-3 flex flex-wrap gap-2">
            <UButton
              v-if="rescue.oc_pdf"
              :to="rescue.oc_pdf"
              target="_blank"
              color="neutral"
              variant="subtle"
              size="sm"
              icon="i-lucide-file-text"
              label="PDF OC"
            />
            <PortalTmsMissingValue v-else label="Sin PDF OC" />
          </div>

          <p
            v-if="rescue.internal_notes"
            class="mt-3 whitespace-pre-wrap text-sm text-highlighted"
          >
            {{ rescue.internal_notes }}
          </p>
        </article>
      </template>

      <UTable
        ref="table"
        sticky
        :class="adminListTableClass"
        :columns="columns"
        :data="rows"
        :loading="isInitialLoading"
        :ui="tableUi"
        :get-row-id="(row: TmsRescue) => String(row.id)"
      >
        <template #id-cell="{ row }">
          <span class="font-mono text-xs tabular-nums text-muted">
            {{ row.original.id }}
          </span>
        </template>

        <template #remittance_folio-cell="{ row }">
          <span v-if="row.original.remittance_folio" class="tabular-nums">
            {{ row.original.remittance_folio }}
          </span>
          <PortalTmsMissingValue v-else label="Sin orden" />
        </template>

        <template #invoice_folio-cell="{ row }">
          <span v-if="row.original.invoice_folio" class="tabular-nums">
            {{ row.original.invoice_folio }}
          </span>
          <PortalTmsMissingValue v-else label="Sin factura" />
        </template>

        <template #oc_pdf-cell="{ row }">
          <UButton
            v-if="row.original.oc_pdf"
            :to="row.original.oc_pdf"
            target="_blank"
            color="neutral"
            variant="subtle"
            size="xs"
            icon="i-lucide-file-text"
            label="PDF"
          />
          <PortalTmsMissingValue v-else label="Sin PDF OC" />
        </template>

        <template #internal_notes-cell="{ row }">
          <p class="whitespace-pre-wrap text-sm text-highlighted">
            {{ row.original.internal_notes || '' }}
          </p>
        </template>

        <template #origen-cell="{ row }">
          <UBadge
            :color="describeTmsUploadOrigin(row.original).color"
            variant="subtle"
            size="sm"
            :icon="describeTmsUploadOrigin(row.original).icon"
            :label="describeTmsUploadOrigin(row.original).label"
          />
        </template>

        <template #empty>
          <div class="py-10 text-center text-sm text-muted">
            No hay rescates completados que coincidan con la búsqueda.
          </div>
        </template>
      </UTable>
    </SharedResponsiveDataList>
  </AdminListPageShell>
</template>
