<script setup lang="ts">
import { useMutation, useQuery, useQueryCache } from '@pinia/colada';
import type { SupplierCreateBody, SupplierServiceType } from '~/interfaces/catalogs/supplier';
import type { RescueSupplierNearbyRow, SupplierMapPin } from '~/interfaces/rescue';
import type { RescueRequestFormState } from '~/schemas/rescue-create';
import { SUPPLIER_SERVICE_TYPE_OPTIONS } from '~/constants/catalog-select-options';
import { RESCUE_SUPPLIER_SORT_OPTIONS } from '~/constants/rescue-select-options';
import { supplierCreateSchema } from '~/schemas/catalog-create';
import { parseRescueCoord } from '~/schemas/rescue-create';

const state = defineModel<RescueRequestFormState>({ required: true });

const toast = useToast();
const queryCache = useQueryCache();
const cacheStore = useSupplierLocationCacheStore();

const latRef = computed(() => state.value.location_latitude);
const lngRef = computed(() => state.value.location_longitude);
const serviceTypeFilter = ref<SupplierServiceType | 'all'>('all');

const serviceTypeFilterItems = [
  { label: 'Todos los tipos', value: 'all' as const },
  ...SUPPLIER_SERVICE_TYPE_OPTIONS,
];

const {
  search,
  sort,
  suppliers,
  loading,
  errorMessage,
  distanceSortBlocked,
} = useRescueSupplierSearch({
  latitude: latRef,
  longitude: lngRef,
  serviceTypeFilter,
});

const showInlineForm = ref(false);
const inlineMapLayoutKey = ref(0);

watch(showInlineForm, (visible) => {
  if (visible) {
    nextTick(() => {
      inlineMapLayoutKey.value += 1;
    });
  }
});
const warnedSupplierIds = ref(new Set<number>());

const selectedRow = computed(() =>
  state.value.supplier != null
    ? suppliers.value.find((s) => s.id === state.value.supplier)
    : undefined,
);

function coordsFromRow(
  row: RescueSupplierNearbyRow,
): { lat: number; lng: number } | null {
  const lat = parseRescueCoord(
    row.latitude != null ? String(row.latitude) : null,
  );
  const lng = parseRescueCoord(
    row.longitude != null ? String(row.longitude) : null,
  );
  if (lat == null || lng == null) return null;
  return { lat, lng };
}

const listHasCoords = computed(() => {
  const row = selectedRow.value;
  return row != null && coordsFromRow(row) != null;
});

const {
  data: supplierDetail,
  asyncStatus: detailAsyncStatus,
} = useQuery({
  key: () => ['supplier-detail', state.value.supplier],
  query: async ({ signal }) =>
    $fetch<Record<string, unknown>>(`/api/supplier/detail/${state.value.supplier}/`, {
      signal,
    }),
  enabled: () => state.value.supplier != null && !listHasCoords.value,
});

const selectedSupplierPin = computed((): SupplierMapPin | null => {
  const row = selectedRow.value;
  if (row) {
    const fromList = coordsFromRow(row);
    if (fromList) {
      return { ...fromList, name: row.name };
    }
  }

  const raw = supplierDetail.value;
  if (raw && state.value.supplier != null) {
    const lat = parseRescueCoord(
      raw.latitude != null ? String(raw.latitude) : null,
    );
    const lng = parseRescueCoord(
      raw.longitude != null ? String(raw.longitude) : null,
    );
    if (lat != null && lng != null) {
      const name =
        state.value.supplierLabel
        || String(raw.name ?? '').trim()
        || `Proveedor #${state.value.supplier}`;
      return { lat, lng, name };
    }
  }

  return null;
});

watch(
  () => [state.value.supplier, selectedSupplierPin.value, detailAsyncStatus.value] as const,
  ([supplierId, pin, status]) => {
    if (supplierId == null || pin != null || listHasCoords.value) return;
    if (status === 'loading') return;
    if (warnedSupplierIds.value.has(supplierId)) return;

    warnedSupplierIds.value.add(supplierId);
    toast.add({
      title: 'Sin ubicación en mapa',
      description: 'Este proveedor no tiene coordenadas registradas.',
      color: 'warning',
    });
  },
);

function emptySupplierState(): SupplierCreateBody {
  return {
    name: '',
    description: '',
    phone: '',
    email: '',
    service_type: ['cranes'],
    is_trusted: false,
    notes: '',
    latitude: state.value.location_latitude ?? '',
    longitude: state.value.location_longitude ?? '',
  };
}

const inlineSupplierState = reactive(emptySupplierState());
const inlineFormRef = ref<{ submit: () => Promise<void> } | null>(null);

watch(showInlineForm, (open) => {
  if (open) {
    Object.assign(inlineSupplierState, emptySupplierState());
  }
});

function selectSupplier(row: RescueSupplierNearbyRow) {
  if (state.value.supplier === row.id) {
    state.value.supplier = null;
    state.value.supplierLabel = '';
    return;
  }
  state.value.supplier = row.id;
  state.value.supplierLabel = row.name;
}

function clearSupplier() {
  state.value.supplier = null;
  state.value.supplierLabel = '';
  warnedSupplierIds.value.clear();
}

const { mutate: createSupplier, asyncStatus: createPending } = useMutation({
  mutation: (body: SupplierCreateBody) =>
    $fetch<{ id: number; name?: string }>('/api/supplier/create/', {
      method: 'POST',
      body,
    }),
  async onSuccess(data) {
    toast.add({ title: 'Proveedor creado', color: 'success' });
    cacheStore.upsertSupplier(
      supplierListItemFromCreateBody(data.id, inlineSupplierState, {
        name: data.name ?? inlineSupplierState.name,
      }),
    );
    await Promise.all([
      queryCache.invalidateQueries({ key: ['suppliers'] }),
      queryCache.invalidateQueries({ key: ['rescue-suppliers-map'] }),
    ]);
    state.value.supplier = data.id;
    state.value.supplierLabel = data.name ?? inlineSupplierState.name;
    showInlineForm.value = false;
  },
  onError: (e) => {
    toast.add({
      title: 'No se pudo crear el proveedor',
      description: getFetchErrorMessage(e),
      color: 'error',
    });
  },
});

function onInlineSubmit(payload: { data: SupplierCreateBody }) {
  createSupplier(payload.data);
}

function formatDistance(km: number | null) {
  if (km == null || !Number.isFinite(km)) return '—';
  return `${km.toFixed(1)} km`;
}

function formatRanking(value: number) {
  if (!Number.isFinite(value) || value <= 0) return '—';
  return value.toFixed(1);
}
</script>

<template>
  <div class="grid min-h-0 grid-cols-1 gap-4 lg:min-h-112 lg:grid-cols-2">
    <div class="order-2 flex min-h-0 flex-col gap-3 lg:order-1">
      <UInput
        v-model="search"
        leading-icon="i-lucide-search"
        placeholder="Buscar proveedor"
        class="w-full"
        variant="subtle"
      />

      <USelectMenu
        v-model="sort"
        :items="[...RESCUE_SUPPLIER_SORT_OPTIONS]"
        value-key="value"
        label-key="label"
        class="w-full"
        variant="subtle"
      />

      <USelectMenu
        v-model="serviceTypeFilter"
        :items="serviceTypeFilterItems"
        value-key="value"
        label-key="label"
        class="w-full"
        variant="subtle"
      />

      <p
        v-if="errorMessage"
        class="text-xs text-error"
        role="alert"
      >
        {{ errorMessage }}
      </p>

      <p
        v-else-if="distanceSortBlocked"
        class="text-xs text-muted"
      >
        Marca la ubicación en el paso anterior para ordenar por distancia.
      </p>

      <div
        v-if="state.supplier"
        class="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm"
      >
        <span>
          Seleccionado:
          <strong>{{ state.supplierLabel || `#${state.supplier}` }}</strong>
        </span>
        <UButton
          type="button"
          size="xs"
          color="neutral"
          variant="ghost"
          label="Quitar"
          @click="clearSupplier"
        />
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto rounded-lg border border-default">
        <div
          v-if="loading"
          class="flex items-center justify-center py-12"
        >
          <UIcon
            name="i-lucide-loader-circle"
            class="size-8 animate-spin text-muted"
          />
        </div>
        <p
          v-else-if="distanceSortBlocked"
          class="px-4 py-8 text-center text-sm text-muted"
        >
          Indica la ubicación de la unidad en el paso anterior para ver
          proveedores ordenados por distancia.
        </p>
        <p
          v-else-if="suppliers.length === 0"
          class="px-4 py-8 text-center text-sm text-muted"
        >
          No hay proveedores que coincidan. Puedes omitir este paso o registrar
          uno nuevo.
        </p>
        <ul v-else class="divide-y divide-default">
          <li
            v-for="row in suppliers"
            :key="row.id"
          >
            <button
              type="button"
              class="flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-elevated"
              :class="
                state.supplier === row.id
                  ? 'bg-primary/10 ring-1 ring-inset ring-primary/40'
                  : ''
              "
              @click="selectSupplier(row)"
            >
              <div class="flex items-start justify-between gap-2">
                <span class="font-medium">{{ row.name }}</span>
                <UBadge
                  v-if="row.is_trusted"
                  color="warning"
                  variant="subtle"
                  size="sm"
                  class="shrink-0"
                >
                  <UIcon name="i-lucide-star" class="size-4" />
                  Confianza
                </UBadge>
              </div>
              <div class="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted">
                <span class="inline-flex items-center gap-1">
                  <UIcon name="i-lucide-star" class="size-3.5 shrink-0" />
                  {{ formatRanking(row.score) }}
                </span>
                <span class="inline-flex items-center gap-1">
                  <UIcon name="i-lucide-phone" class="size-3.5 shrink-0" />
                  {{ row.phone || '—' }}
                </span>
                <span class="inline-flex items-center gap-1">
                  <UIcon name="i-lucide-truck" class="size-3.5 shrink-0" />
                  {{ formatSupplierRescuesCount(row.rescues_count) }}
                </span>
                <span class="inline-flex items-center gap-1">
                  <UIcon name="i-lucide-map-pin" class="size-3.5 shrink-0" />
                  {{ formatDistance(row.distance_km) }}
                </span>
              </div>
            </button>
          </li>
        </ul>
      </div>

      <UButton
        type="button"
        color="neutral"
        variant="outline"
        block
        :icon="showInlineForm ? 'i-lucide-chevron-up' : 'i-lucide-plus'"
        :label="
          showInlineForm
            ? 'Ocultar formulario'
            : 'Agregar un proveedor no registrado'
        "
        @click="() => { showInlineForm = !showInlineForm }"
      />

      <div
        v-if="showInlineForm"
        class="rounded-lg border border-dashed border-default p-4"
      >
        <UForm
          ref="inlineFormRef"
          :schema="supplierCreateSchema"
          :state="inlineSupplierState"
          class="space-y-4"
          @submit="onInlineSubmit"
        >
          <CatalogSupplierFormFields
            v-model:state="inlineSupplierState"
            :map-layout-key="inlineMapLayoutKey"
          />
          <UButton
            type="button"
            label="Guardar proveedor"
            :loading="createPending === 'loading'"
            :disabled="createPending === 'loading'"
            @click="inlineFormRef?.submit()"
          />
        </UForm>
      </div>
    </div>

    <OperationalRescueRequestSupplierStepMap
      class="order-1 h-[40vh] min-h-48 lg:order-2 lg:h-full lg:min-h-72"
      :unit-latitude="state.location_latitude"
      :unit-longitude="state.location_longitude"
      :selected-supplier="selectedSupplierPin"
    />
  </div>
</template>
