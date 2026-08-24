<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui';
import type {
  TmsRescue,
  TmsRescueFilters,
  TmsRescueUpdateBody,
  TmsRowSaveStatus,
} from '~/interfaces/portals/tms';
import type { TmsTriStateOption } from '~/utils/tms-portal';
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
const readyFilter = ref<TmsTriStateOption>('all');
const confirmFilter = ref<TmsTriStateOption>('all');
const ocPdfFilter = ref<TmsTriStateOption>('all');
const tableRef = useTemplateRef('table');
const drafts = reactive<Record<number, TmsRescueDraftState>>({});
/** Refleja el check de "Listo" mientras el backend confirma el cambio. */
const readyOverrides = reactive<Record<number, boolean | undefined>>({});
const rowStatus = reactive<Record<number, TmsRowSaveStatus>>({});
const rowErrors = reactive<Record<number, string | null>>({});
const savedTimers = new Map<number, ReturnType<typeof setTimeout>>();
const ocAssignmentLocks = new Set<number>();

const readyFilterItems = tmsTriStateItems('Listo');
const confirmFilterItems = tmsTriStateItems('Confirmado');
const ocPdfFilterItems = tmsTriStateItems('PDF OC');

const filters = computed<TmsRescueFilters>(() => ({
  ready: toTmsTriState(readyFilter.value),
  confirm: toTmsTriState(confirmFilter.value),
  oc_pdf: toTmsTriState(ocPdfFilter.value),
}));

const {
  rows,
  asyncStatus,
  hasNextPage,
  loadNextPage,
  isInitialLoading,
  isError,
  errorMessage,
  refresh,
} = useTmsRescueList(filters);

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
      if (readyOverrides[rescue.id] === rescue.ready) {
        readyOverrides[rescue.id] = undefined;
      }
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
    if (isTmsRescueReadOnly(rescue)) {
      return { ...rescue, isDirty: false };
    }

    const draft = drafts[rescue.id];
    const internalNotes = draft?.internal_notes ?? rescue.internal_notes;
    const ocPdf = draft?.oc_pdf || null;
    return {
      ...rescue,
      internal_notes: internalNotes,
      oc_pdf: ocPdf,
      ready: readyOverrides[rescue.id] ?? rescue.ready,
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

/**
 * Anchos fijos por columna: con `table-fixed` la tabla siempre cabe en el
 * contenedor y «Notas internas» (sin ancho) absorbe el espacio restante.
 */
function columnWidth(width: string) {
  return { class: { th: width, td: `${width} align-top` } };
}

const columns: TableColumn<TmsRescueDisplay>[] = [
  { accessorKey: 'id', header: 'ID', meta: columnWidth('w-12') },
  { accessorKey: 'folio', header: 'Folio', meta: columnWidth('w-36') },
  {
    accessorKey: 'pdf_alegra',
    header: 'PDF Alegra',
    meta: columnWidth('w-24'),
  },
  {
    accessorKey: 'xml_alegra',
    header: 'XML Alegra',
    meta: columnWidth('w-24'),
  },
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
  {
    accessorKey: 'oc_pdf',
    header: 'PDF OC',
    meta: columnWidth('w-28'),
  },
  {
    accessorKey: 'internal_notes',
    header: 'Notas internas',
    meta: { class: { td: 'align-top' } },
  },
  { accessorKey: 'ready', header: 'Listo', meta: columnWidth('w-32') },
];

/**
 * `table-fixed` evita el scroll horizontal (la causa de que «Listo» quedara
 * pegado al borde) y el carril de scroll reservado impide que la barra vertical
 * se monte sobre la última columna.
 */
const tableUi = {
  root: '[scrollbar-gutter:stable]',
  base: 'w-full table-fixed',
  th: 'px-2.5 py-2 whitespace-normal',
  td: 'px-2.5 py-2 whitespace-normal',
} as const;

const tableMeta = {
  class: {
    tr: (row: { original: TmsRescueDisplay }) =>
      isTmsRescueComplete(row.original)
        ? 'bg-success/[0.07] hover:bg-success/[0.12]'
        : '',
  },
};

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
  if (!source || isTmsRescueReadOnly(source)) return;

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

async function toggleReady(rescueId: number, value: boolean) {
  if (rowStatus[rescueId] === 'saving') return;

  const source = rows.value.find((item) => item.id === rescueId);
  if (!source || isTmsRescueReadOnly(source) || source.ready === value) return;

  readyOverrides[rescueId] = value;
  rowStatus[rescueId] = 'saving';
  const saved = await updateRescue(
    {
      id: rescueId,
      oc_pdf: source.oc_pdf,
      internal_notes: source.internal_notes,
      ready: value,
    },
    { silentSuccess: true },
  );
  if (!saved) {
    readyOverrides[rescueId] = undefined;
    rowErrors[rescueId] = 'No se pudo actualizar el estado «Listo»';
    rowStatus[rescueId] = 'error';
    return;
  }

  rowErrors[rescueId] = null;
  flashSaved(rescueId);
}

async function assignPurchaseOrder(payload: { rescueId: number; url: string }) {
  const rescue = displayRows.value.find((item) => item.id === payload.rescueId);
  if (
    !rescue
    || isTmsRescueReadOnly(rescue)
    || Boolean(rescue.oc_pdf?.trim())
    || ocAssignmentLocks.has(payload.rescueId)
  ) {
    return;
  }

  ocAssignmentLocks.add(payload.rescueId);
  const body: TmsRescueUpdateBody = {
    id: payload.rescueId,
    oc_pdf: payload.url,
    internal_notes: rescue.internal_notes,
  };
  rowStatus[payload.rescueId] = 'saving';
  const saved = await updateRescue(body, { silentSuccess: true });
  if (!saved) {
    ocAssignmentLocks.delete(payload.rescueId);
    rowErrors[payload.rescueId] = 'No se pudo guardar la orden de compra';
    rowStatus[payload.rescueId] = 'error';
    return;
  }

  drafts[payload.rescueId] = {
    internal_notes: body.internal_notes,
    oc_pdf: payload.url,
  };
  rowErrors[payload.rescueId] = null;
  ocAssignmentLocks.delete(payload.rescueId);
  flashSaved(payload.rescueId);
}
</script>

<template>
  <AdminListPageShell
    fluid
    navbar-title="Portal TMS"
    title="TMS"
    description="Edita el PDF de la orden de compra y las notas internas en la tabla; se guardan al salir del campo. Las filas en verde ya tienen toda la documentación."
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
      <USelect
        v-model="readyFilter"
        :items="readyFilterItems"
        value-key="value"
        label-key="label"
        icon="i-lucide-check-check"
        variant="subtle"
        class="w-full sm:w-44"
        :ui="{ base: 'bg-default' }"
      />
      <USelect
        v-model="confirmFilter"
        :items="confirmFilterItems"
        value-key="value"
        label-key="label"
        icon="i-lucide-badge-check"
        variant="subtle"
        class="w-full sm:w-52"
        :ui="{ base: 'bg-default' }"
      />
      <USelect
        v-model="ocPdfFilter"
        :items="ocPdfFilterItems"
        value-key="value"
        label-key="label"
        icon="i-lucide-file-text"
        variant="subtle"
        class="w-full sm:w-44"
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
          class="rounded-lg border p-4"
          :class="
            isTmsRescueComplete(rescue)
              ? 'border-success/40 bg-success/[0.07]'
              : 'border-default bg-default'
          "
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <h2 class="font-semibold text-highlighted">
                {{ rescue.folio }}
              </h2>
              <p class="mt-1 text-xs text-muted">ID {{ rescue.id }}</p>
              <div class="mt-2 flex flex-wrap items-center gap-1.5">
                <UIcon
                  v-if="isTmsRescueReadOnly(rescue)"
                  name="i-lucide-lock"
                  class="size-3.5 shrink-0 text-muted"
                  aria-label="Rescate de solo lectura"
                />
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
            </div>
            <div class="flex shrink-0 flex-col items-end gap-2">
              <UCheckbox
                :model-value="rescue.ready"
                :disabled="
                  isTmsRescueReadOnly(rescue)
                  || rowStatus[rescue.id] === 'saving'
                "
                :color="rescue.ready ? 'success' : 'error'"
                :label="rescue.ready ? 'Listo' : 'No listo'"
                :ui="{ label: rescue.ready ? 'text-success' : 'text-error' }"
                @update:model-value="
                  (value) => void toggleReady(rescue.id, value === true)
                "
              />
              <PortalTmsRowSaveStatus
                :status="rowStatus[rescue.id] ?? 'idle'"
                :error="rowErrors[rescue.id]"
                :dirty="rescue.isDirty"
              />
            </div>
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
            <PortalTmsMissingValue
              v-if="!rescue.pdf_alegra"
              label="Sin PDF"
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
            <PortalTmsMissingValue
              v-if="!rescue.xml_alegra"
              label="Sin XML"
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
                :readonly="isTmsRescueReadOnly(rescue)"
                :disabled="rowStatus[rescue.id] === 'saving'"
                @uploaded="(url) => void assignPurchaseOrder({ rescueId: rescue.id, url })"
              />
            </UFormField>

            <UFormField label="Notas internas">
              <p
                v-if="isTmsRescueReadOnly(rescue)"
                class="whitespace-pre-wrap text-sm text-highlighted"
              >
                {{ rescue.internal_notes || '' }}
              </p>
              <div
                v-else
                class="space-y-1.5"
              >
                <UTextarea
                  v-model="draftFor(rescue.id).internal_notes"
                  :rows="2"
                  autoresize
                  :maxrows="10"
                  placeholder="Notas para el seguimiento del rescate"
                  class="w-full"
                  :disabled="rowStatus[rescue.id] === 'saving'"
                  :color="rescue.internal_notes ? 'primary' : 'error'"
                  :highlight="!rescue.internal_notes"
                  @blur="() => void commitDraft(rescue.id)"
                  @keydown.esc="revertDraft(rescue.id)"
                />
                <PortalTmsMissingValue
                  v-if="!rescue.internal_notes"
                  label="Sin nota interna"
                />
              </div>
              <PortalTmsMissingValue
                v-if="isTmsRescueReadOnly(rescue) && !rescue.internal_notes"
                label="Sin nota interna"
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
        :meta="tableMeta"
        :ui="tableUi"
        :get-row-id="(row: TmsRescueDisplay) => String(row.id)"
      >
        <template #id-cell="{ row }">
          <span class="font-mono text-xs tabular-nums text-muted">
            {{ row.original.id }}
          </span>
        </template>

        <template #folio-cell="{ row }">
          <div class="flex flex-wrap items-center gap-1.5">
            <span class="font-semibold text-highlighted">
              {{ row.original.folio }}
            </span>
            <UIcon
              v-if="isTmsRescueReadOnly(row.original)"
              name="i-lucide-lock"
              class="size-3.5 shrink-0 text-muted"
              aria-label="Rescate de solo lectura"
            />
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
            variant="subtle"
            size="xs"
            icon="i-lucide-file-text"
            label="PDF"
          />
          <PortalTmsMissingValue v-else label="Sin PDF" />
        </template>

        <template #xml_alegra-cell="{ row }">
          <UButton
            v-if="row.original.xml_alegra"
            :to="row.original.xml_alegra"
            target="_blank"
            color="neutral"
            variant="subtle"
            size="xs"
            icon="i-lucide-file-code-2"
            label="XML"
          />
          <PortalTmsMissingValue v-else label="Sin XML" />
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
          <div class="space-y-1">
            <PortalTmsOcPdfCell
              :folio="row.original.folio"
              :url="row.original.oc_pdf"
              :readonly="isTmsRescueReadOnly(row.original)"
              :disabled="rowStatus[row.original.id] === 'saving'"
              @uploaded="(url) => void assignPurchaseOrder({ rescueId: row.original.id, url })"
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
          <p
            v-if="isTmsRescueReadOnly(row.original)"
            class="whitespace-pre-wrap text-sm text-highlighted"
          >
            {{ row.original.internal_notes || '' }}
          </p>
          <div
            v-else
            class="space-y-1.5"
          >
            <UTextarea
              v-model="draftFor(row.original.id).internal_notes"
              :rows="2"
              autoresize
              :maxrows="10"
              size="sm"
              placeholder="Escribe la nota interna"
              class="w-full"
              :aria-label="`Notas internas de ${row.original.folio}`"
              :disabled="rowStatus[row.original.id] === 'saving'"
              :color="row.original.internal_notes ? 'primary' : 'error'"
              :highlight="!row.original.internal_notes"
              @blur="() => void commitDraft(row.original.id)"
              @keydown.esc="revertDraft(row.original.id)"
            />
            <PortalTmsMissingValue
              v-if="!row.original.internal_notes"
              label="Sin nota interna"
            />
          </div>
          <PortalTmsMissingValue
            v-if="isTmsRescueReadOnly(row.original) && !row.original.internal_notes"
            label="Sin nota interna"
          />
        </template>

        <template #ready-cell="{ row }">
          <UCheckbox
            :model-value="row.original.ready"
            :disabled="
              isTmsRescueReadOnly(row.original)
              || rowStatus[row.original.id] === 'saving'
            "
            :color="row.original.ready ? 'success' : 'error'"
            :label="row.original.ready ? 'Listo' : 'No listo'"
            :ui="{ label: row.original.ready ? 'text-success' : 'text-error' }"
            @update:model-value="
              (value) => void toggleReady(row.original.id, value === true)
            "
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
