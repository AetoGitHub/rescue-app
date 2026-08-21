<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui';
import type {
  TmsRescue,
  TmsRescueUpdateBody,
  TmsRowSaveStatus,
} from '~/interfaces/portals/tms';
import {
  tmsRescueDraftSchema,
  tmsRescueDraftToUpdateBody,
  type TmsRescueDraftState,
} from '~/schemas/tms-portal';
import { adminListTableClass } from '~/constants/admin-list-layout';

type TmsRescueDisplay = TmsRescue & {
  isDirty: boolean;
};

const SAVED_FLASH_MS = 2500;

useHead({ title: 'Portal TMS' });

const search = ref('');
const tableRef = useTemplateRef('table');
const drafts = reactive<Record<number, TmsRescueDraftState>>({});
const rowStatus = reactive<Record<number, TmsRowSaveStatus>>({});
const rowErrors = reactive<Record<number, string | null>>({});
const savedTimers = new Map<number, ReturnType<typeof setTimeout>>();

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

const { updateRescue, triggerPortal, isTriggering } = useTmsRescueMutations();

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

const columns: TableColumn<TmsRescueDisplay>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'folio', header: 'Folio' },
  { accessorKey: 'pdf_alegra', header: 'PDF Alegra' },
  { accessorKey: 'xml_alegra', header: 'XML Alegra' },
  { accessorKey: 'remittance_folio', header: 'Orden de compra' },
  { accessorKey: 'invoice_folio', header: 'Factura' },
  {
    accessorKey: 'oc_pdf',
    header: 'PDF OC',
    meta: { class: { th: 'min-w-72', td: 'min-w-72 align-top' } },
  },
  {
    accessorKey: 'internal_notes',
    header: 'Notas internas',
    meta: {
      class: {
        th: 'w-full min-w-72',
        td: 'w-full min-w-72 whitespace-normal align-top',
      },
    },
  },
];

function draftFor(rescueId: number): TmsRescueDraftState {
  const existing = drafts[rescueId];
  if (existing) return existing;

  const rescue = rows.value.find((item) => item.id === rescueId);
  const draft: TmsRescueDraftState = {
    internal_notes: rescue?.internal_notes ?? '',
    oc_pdf: rescue?.oc_pdf ?? '',
  };
  drafts[rescueId] = draft;
  return draft;
}

function flashSaved(rescueId: number) {
  rowStatus[rescueId] = 'saved';
  clearTimeout(savedTimers.get(rescueId));
  savedTimers.set(
    rescueId,
    setTimeout(() => {
      if (rowStatus[rescueId] === 'saved') rowStatus[rescueId] = 'idle';
      savedTimers.delete(rescueId);
    }, SAVED_FLASH_MS),
  );
}

onScopeDispose(() => {
  for (const timer of savedTimers.values()) clearTimeout(timer);
  savedTimers.clear();
});

/** Persiste el borrador de la fila; se dispara al salir del campo. */
async function commitDraft(rescueId: number) {
  if (rowStatus[rescueId] === 'saving') return;

  const source = rows.value.find((item) => item.id === rescueId);
  if (!source) return;

  const parsed = tmsRescueDraftSchema.safeParse(draftFor(rescueId));
  if (!parsed.success) {
    rowErrors[rescueId] =
      parsed.error.issues[0]?.message ?? 'Revisa los datos de la fila';
    rowStatus[rescueId] = 'error';
    return;
  }

  const body = tmsRescueDraftToUpdateBody(rescueId, parsed.data);
  if (
    body.internal_notes === source.internal_notes
    && body.oc_pdf === source.oc_pdf
  ) {
    rowErrors[rescueId] = null;
    if (rowStatus[rescueId] !== 'saved') rowStatus[rescueId] = 'idle';
    return;
  }

  rowStatus[rescueId] = 'saving';
  const saved = await updateRescue(body, { silentSuccess: true });
  if (!saved) {
    rowErrors[rescueId] = 'No se pudo guardar, vuelve a intentarlo';
    rowStatus[rescueId] = 'error';
    return;
  }

  drafts[rescueId] = {
    internal_notes: body.internal_notes,
    oc_pdf: body.oc_pdf ?? '',
  };
  rowErrors[rescueId] = null;
  flashSaved(rescueId);
}

function revertDraft(rescueId: number) {
  const source = rows.value.find((item) => item.id === rescueId);
  if (!source) return;
  drafts[rescueId] = {
    internal_notes: source.internal_notes,
    oc_pdf: source.oc_pdf ?? '',
  };
  rowErrors[rescueId] = null;
  rowStatus[rescueId] = 'idle';
}

function clearOcPdf(rescueId: number) {
  draftFor(rescueId).oc_pdf = '';
  void commitDraft(rescueId);
}

async function assignPurchaseOrder(payload: { rescueId: number; url: string }) {
  const rescue = displayRows.value.find((item) => item.id === payload.rescueId);
  if (!rescue) return;

  const body: TmsRescueUpdateBody = {
    id: payload.rescueId,
    oc_pdf: payload.url,
    internal_notes: rescue.internal_notes,
  };
  rowStatus[payload.rescueId] = 'saving';
  const saved = await updateRescue(body, { silentSuccess: true });
  if (!saved) {
    rowErrors[payload.rescueId] = 'No se pudo guardar la orden de compra';
    rowStatus[payload.rescueId] = 'error';
    return;
  }

  drafts[payload.rescueId] = {
    internal_notes: body.internal_notes,
    oc_pdf: payload.url,
  };
  rowErrors[payload.rescueId] = null;
  flashSaved(payload.rescueId);
}
</script>

<template>
  <AdminListPageShell
    navbar-title="Portal TMS"
    title="TMS"
    description="Edita el PDF de la orden de compra y las notas internas en la tabla; se guardan al salir del campo."
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
        :label="`${displayRows.filter((row) => row.isDirty).length} filas sin guardar`"
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
              <h2 class="font-semibold text-highlighted">
                {{ rescue.folio }}
              </h2>
              <p class="mt-1 text-xs text-muted">
                ID {{ rescue.id }} · OC {{ rescue.remittance_folio || '—' }} ·
                Factura {{ rescue.invoice_folio || '—' }}
              </p>
            </div>
            <PortalTmsRowSaveStatus
              :status="rowStatus[rescue.id] ?? 'idle'"
              :error="rowErrors[rescue.id]"
              :dirty="rescue.isDirty"
            />
          </div>

          <div class="mt-3 flex flex-wrap gap-2">
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
          </div>

          <div class="mt-4 space-y-3">
            <UFormField
              label="PDF OC"
              :error="rowErrors[rescue.id] || undefined"
            >
              <PortalTmsOcPdfCell
                :folio="rescue.folio"
                :url="rescue.oc_pdf"
                :disabled="rowStatus[rescue.id] === 'saving'"
                @uploaded="(url) => void assignPurchaseOrder({ rescueId: rescue.id, url })"
                @remove="clearOcPdf(rescue.id)"
              />
            </UFormField>

            <UFormField label="Notas internas">
              <UTextarea
                v-model="draftFor(rescue.id).internal_notes"
                :rows="2"
                autoresize
                :maxrows="6"
                placeholder="Notas para el seguimiento del rescate"
                class="w-full"
                :disabled="rowStatus[rescue.id] === 'saving'"
                @blur="() => void commitDraft(rescue.id)"
                @keydown.esc="revertDraft(rescue.id)"
              />
            </UFormField>
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
            <PortalTmsRowSaveStatus
              :status="rowStatus[row.original.id] ?? 'idle'"
              :error="rowErrors[row.original.id]"
              :dirty="row.original.isDirty"
            />
          </div>
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
          <div class="space-y-1">
            <PortalTmsOcPdfCell
              :folio="row.original.folio"
              :url="row.original.oc_pdf"
              :disabled="rowStatus[row.original.id] === 'saving'"
              @uploaded="(url) => void assignPurchaseOrder({ rescueId: row.original.id, url })"
              @remove="clearOcPdf(row.original.id)"
            />
            <p
              v-if="rowErrors[row.original.id]"
              class="text-xs text-error"
            >
              {{ rowErrors[row.original.id] }}
            </p>
          </div>
        </template>

        <template #internal_notes-cell="{ row }">
          <UTextarea
            v-model="draftFor(row.original.id).internal_notes"
            :rows="1"
            autoresize
            :maxrows="5"
            size="sm"
            placeholder="Sin notas internas"
            class="w-full"
            :aria-label="`Notas internas de ${row.original.folio}`"
            :disabled="rowStatus[row.original.id] === 'saving'"
            @blur="() => void commitDraft(row.original.id)"
            @keydown.esc="revertDraft(row.original.id)"
          />
        </template>

        <template #empty>
          <div class="py-10 text-center text-sm text-muted">
            No hay rescates que coincidan con la búsqueda.
          </div>
        </template>
      </UTable>
    </SharedResponsiveDataList>
  </AdminListPageShell>
</template>
