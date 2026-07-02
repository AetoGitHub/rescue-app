<script setup lang="ts">
import { useMutation, useQuery, useQueryCache } from '@pinia/colada';
import type { SupplierCreateBody, SupplierServiceType } from '~/interfaces/catalogs/supplier';
import type { RescueSupplierNearbyRow, SupplierMapPin } from '~/interfaces/rescue';
import type { RescueRequestFormState } from '~/schemas/rescue-create';
import {
  supplierCreateSchema,
  supplierCreateToCreateBody,
  type SupplierCreateFormOutput,
} from '~/schemas/catalog-create';
import { parseRescueCoord } from '~/schemas/rescue-create';

const state = defineModel<RescueRequestFormState>({ required: true });

const toast = useToast();
const queryCache = useQueryCache();
const cacheStore = useSupplierLocationCacheStore();

const latRef = computed(() => state.value.location_latitude);
const lngRef = computed(() => state.value.location_longitude);
const serviceTypeFilter = ref<SupplierServiceType | 'all'>('all');

const { queryParams, displayQueryParams, setViewport } = useSupplierMapViewport();

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
  fetchViewport: queryParams,
  displayViewport: displayQueryParams,
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

function onInlineSubmit(payload: { data: SupplierCreateFormOutput }) {
  createSupplier(supplierCreateToCreateBody(payload.data) as SupplierCreateBody);
}

function toggleInlineForm() {
  showInlineForm.value = !showInlineForm.value;
}
</script>

<template>
  <div class="space-y-3">
    <div
      v-if="state.supplier"
      class="flex min-w-0 items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm"
    >
      <span class="min-w-0 break-all">
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

    <OperationalRescueRequestRescueSupplierMapLayout>
      <template #list>
        <OperationalRescueRequestRescueSupplierPickerList
          v-model:search="search"
          v-model:service-type-filter="serviceTypeFilter"
          v-model:sort="sort"
          :suppliers="suppliers"
          :selected-id="state.supplier"
          :loading="loading"
          :distance-sort-blocked="distanceSortBlocked"
          :error-message="errorMessage"
          distance-blocked-message="Marca la ubicación en el paso anterior para ordenar por distancia."
          empty-message="No hay proveedores que coincidan. Puedes omitir este paso o registrar uno nuevo."
          show-add-provider-link
          @select="selectSupplier"
          @toggle-add-provider="toggleInlineForm"
        >
          <template #add-provider>
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
          </template>
        </OperationalRescueRequestRescueSupplierPickerList>
      </template>

      <template #map>
        <OperationalRescueRequestSupplierStepMap
          class="h-full min-h-48 w-full"
          :unit-latitude="state.location_latitude"
          :unit-longitude="state.location_longitude"
          :selected-supplier="selectedSupplierPin"
          :selected-supplier-id="state.supplier"
          :nearby-suppliers="suppliers"
          @viewport-change="setViewport"
        />
      </template>
    </OperationalRescueRequestRescueSupplierMapLayout>
  </div>
</template>
