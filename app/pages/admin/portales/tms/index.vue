<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui';
import type {
  TmsRescue,
  TmsRescueUpdateBody,
} from '~/interfaces/portals/tms';
import type { TmsRescueDraftState } from '~/schemas/tms-portal';
import { adminListTableClass } from '~/constants/admin-list-layout';

type TmsRescueDisplay = TmsRescue & {
  isDirty: boolean;
};

useHead({ title: 'Portal TMS' });

const search = ref('');
const tableRef = useTemplateRef('table');
const drafts = reactive<Record<number, TmsRescueDraftState>>({});
const selectedRescueId = ref<number | null>(null);
const editOpen = ref(false);

const {
  rows,
  asyncStatus,
  hasNextPage,
  loadNextPage,
  isInitialLoading,
  isError,
  errorMessage,
  refresh,
} = useTmsRescueList();

const {
  updateRescue,
  triggerPortal,
  isUpdating,
  isTriggering,
} = useTmsRescueMutations();

usePaginatedTableInfiniteScroll({
  tableRef,
  hasNextPage,
  loadNextPage,
  asyncStatus,
});

watch(
  rows,
  (value) => {
    for (const rescue of value) {
      if (drafts[rescue.id] != null) continue;
      drafts[rescue.id] = {
        internal_notes: rescue.internal_notes,
        oc_pdf: rescue.oc_pdf ?? '',
      };
    }
  },
  { immediate: true },
);

const displayRows = computed<TmsRescueDisplay[]>(() =>
  rows.value.map((rescue) => {
    const draft = drafts[rescue.id];
    const internalNotes = draft?.internal_notes ?? rescue.internal_notes;
    const ocPdf = draft?.oc_pdf || null;
    return {
      ...rescue,
      internal_notes: internalNotes,
      oc_pdf: ocPdf,
      isDirty:
        internalNotes !== rescue.internal_notes
        || ocPdf !== rescue.oc_pdf,
    };
  }),
);

const filteredRows = computed(() =>
  displayRows.value.filter((rescue) =>
    matchesTmsRescueSearch(rescue, search.value),
  ),
);

const selectedRescue = computed(
  () =>
    displayRows.value.find((rescue) => rescue.id === selectedRescueId.value)
    ?? null,
);

const columns: TableColumn<TmsRescueDisplay>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'folio', header: 'Folio' },
  { accessorKey: 'internal_notes', header: 'Notas internas' },
  { accessorKey: 'pdf_alegra', header: 'PDF Alegra' },
  { accessorKey: 'xml_alegra', header: 'XML Alegra' },
  { accessorKey: 'remittance_folio', header: 'Orden de compra' },
  { accessorKey: 'invoice_folio', header: 'Factura' },
  { accessorKey: 'oc_pdf', header: 'PDF OC' },
  { id: 'actions', header: '' },
];

function openEditor(rescue: TmsRescue) {
  selectedRescueId.value = rescue.id;
  editOpen.value = true;
}

async function applyDraft(payload: {
  rescueId: number;
  body: TmsRescueUpdateBody;
}) {
  const saved = await updateRescue(payload.body);
  if (!saved) return;
  drafts[payload.rescueId] = {
    internal_notes: payload.body.internal_notes,
    oc_pdf: payload.body.oc_pdf ?? '',
  };
  editOpen.value = false;
}

async function assignPurchaseOrder(payload: { rescueId: number; url: string }) {
  const rescue = displayRows.value.find((item) => item.id === payload.rescueId);
  if (!rescue) return;
  const body: TmsRescueUpdateBody = {
    id: payload.rescueId,
    oc_pdf: payload.url,
    internal_notes: rescue.internal_notes,
  };
  const saved = await updateRescue(body);
  if (!saved) return;
  drafts[payload.rescueId] = {
    internal_notes: body.internal_notes,
    oc_pdf: payload.url,
  };
}
</script>

<template>
  <AdminListPageShell
    navbar-title="Portal TMS"
    title="TMS"
    description="Relaciona facturas, órdenes de compra y sus PDFs de los rescates."
  >
    <template #actions>
      <UButton
        color="neutral"
        variant="subtle"
        icon="i-lucide-play"
        label="Disparar proceso"
        :loading="isTriggering"
        :disabled="isTriggering"
        @click="() => void triggerPortal()"
      />
      <PortalTmsPurchaseOrderUploadModal
        :rescues="displayRows"
        @assign="assignPurchaseOrder"
      />
    </template>

    <template #filters>
      <UInput
        v-model="search"
        leading-icon="i-lucide-search"
        placeholder="Buscar folio, orden de compra, factura o nota"
        class="w-full sm:max-w-md"
        variant="subtle"
        :ui="{ base: 'bg-default' }"
      />
      <UBadge
        v-if="displayRows.some((row) => row.isDirty)"
        color="warning"
        variant="subtle"
        :label="`${displayRows.filter((row) => row.isDirty).length} borradores pendientes`"
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
        {{ errorMessage || 'No se pudo cargar el portal TMS.' }}
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
          v-if="filteredRows.length === 0"
          class="rounded-lg border border-dashed border-default p-8 text-center text-sm text-muted"
        >
          No hay rescates que coincidan con la búsqueda.
        </div>

        <article
          v-for="rescue in filteredRows"
          :key="rescue.id"
          class="rounded-lg border border-default bg-default p-4"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="font-semibold text-highlighted">
                  {{ rescue.folio }}
                </h2>
                <UBadge
                  v-if="rescue.isDirty"
                  color="warning"
                  variant="subtle"
                  label="Borrador"
                  size="sm"
                />
              </div>
              <p class="mt-1 text-xs text-muted">
                ID {{ rescue.id }} · OC {{ rescue.remittance_folio || '—' }}
              </p>
            </div>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-pencil"
              aria-label="Editar borrador"
              @click="openEditor(rescue)"
            />
          </div>

          <p class="mt-3 text-sm text-toned whitespace-pre-line">
            {{ rescue.internal_notes || 'Sin notas internas' }}
          </p>

          <div class="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span class="text-muted">Factura</span>
              <p class="font-medium text-highlighted">
                {{ rescue.invoice_folio || '—' }}
              </p>
            </div>
            <div>
              <span class="text-muted">PDF OC</span>
              <p class="font-medium" :class="rescue.oc_pdf ? 'text-success' : 'text-muted'">
                {{ rescue.oc_pdf ? 'Asignado' : 'Pendiente' }}
              </p>
            </div>
          </div>

          <div class="mt-4 flex flex-wrap gap-2">
            <UButton
              v-if="rescue.pdf_alegra"
              :to="rescue.pdf_alegra"
              target="_blank"
              color="neutral"
              variant="subtle"
              size="sm"
              icon="i-lucide-file-text"
              label="PDF"
            />
            <UButton
              v-if="rescue.xml_alegra"
              :to="rescue.xml_alegra"
              target="_blank"
              color="neutral"
              variant="subtle"
              size="sm"
              icon="i-lucide-file-code-2"
              label="XML"
            />
            <UButton
              v-if="rescue.oc_pdf"
              :to="rescue.oc_pdf"
              target="_blank"
              color="primary"
              variant="subtle"
              size="sm"
              icon="i-lucide-external-link"
              label="Ver OC"
            />
          </div>
        </article>
      </template>

      <UTable
        ref="table"
        sticky
        :class="adminListTableClass"
        :columns="columns"
        :data="filteredRows"
        :loading="isInitialLoading"
        :get-row-id="(row: TmsRescueDisplay) => String(row.id)"
        :ui="{ base: 'min-w-280' }"
      >
        <template #id-cell="{ row }">
          <span class="font-mono text-xs tabular-nums text-muted">
            {{ row.original.id }}
          </span>
        </template>

        <template #folio-cell="{ row }">
          <div class="flex items-center gap-2">
            <span class="font-semibold text-highlighted">
              {{ row.original.folio }}
            </span>
            <UBadge
              v-if="row.original.isDirty"
              color="warning"
              variant="subtle"
              label="Borrador"
              size="sm"
            />
          </div>
        </template>

        <template #internal_notes-cell="{ row }">
          <p class="max-w-72 whitespace-pre-line text-sm text-toned">
            {{ row.original.internal_notes || '—' }}
          </p>
        </template>

        <template #pdf_alegra-cell="{ row }">
          <UButton
            v-if="row.original.pdf_alegra"
            :to="row.original.pdf_alegra"
            target="_blank"
            color="neutral"
            variant="ghost"
            icon="i-lucide-file-text"
            aria-label="Abrir PDF de Alegra"
          />
          <span v-else class="text-muted">—</span>
        </template>

        <template #xml_alegra-cell="{ row }">
          <UButton
            v-if="row.original.xml_alegra"
            :to="row.original.xml_alegra"
            target="_blank"
            color="neutral"
            variant="ghost"
            icon="i-lucide-file-code-2"
            aria-label="Abrir XML de Alegra"
          />
          <span v-else class="text-muted">—</span>
        </template>

        <template #remittance_folio-cell="{ row }">
          <span class="tabular-nums">
            {{ row.original.remittance_folio || '—' }}
          </span>
        </template>

        <template #invoice_folio-cell="{ row }">
          <span class="tabular-nums">
            {{ row.original.invoice_folio || '—' }}
          </span>
        </template>

        <template #oc_pdf-cell="{ row }">
          <UButton
            v-if="row.original.oc_pdf"
            :to="row.original.oc_pdf"
            target="_blank"
            color="success"
            variant="subtle"
            size="sm"
            icon="i-lucide-file-check-2"
            label="Ver OC"
          />
          <UBadge
            v-else
            color="warning"
            variant="subtle"
            label="Pendiente"
          />
        </template>

        <template #actions-cell="{ row }">
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-pencil"
            aria-label="Editar notas y PDF de la orden de compra"
            @click="openEditor(row.original)"
          />
        </template>

        <template #empty>
          <div class="py-10 text-center text-sm text-muted">
            No hay rescates que coincidan con la búsqueda.
          </div>
        </template>
      </UTable>
    </SharedResponsiveDataList>

    <PortalTmsRescueDraftModal
      v-model:open="editOpen"
      :rescue="selectedRescue"
      :loading="isUpdating"
      @apply="applyDraft"
    />
  </AdminListPageShell>
</template>
