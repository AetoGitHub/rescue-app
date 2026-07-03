<script setup lang="ts">
import { useQuery } from '@pinia/colada';
import type { FormSubmitEvent } from '@nuxt/ui';
import type { RescueSupplierNearbyRow, SupplierMapPin } from '~/interfaces/rescue';
import type { SupplierServiceType } from '~/interfaces/catalogs/supplier';
import {
  rescueSupplierAssignSchema,
  rescueSupplierAssignToBody,
  type RescueSupplierAssignFormState,
} from '~/schemas/rescue-supplier-assign';
import { parseRescueCoord } from '~/schemas/rescue-create';
import type { z } from 'zod';

const open = defineModel<boolean>('open', { required: true });

const props = defineProps<{
  rescueId: number;
  latitude: string | null;
  longitude: string | null;
  currentSupplierId: number | null;
  currentSupplierName: string | null;
  loading?: boolean;
}>();

const emit = defineEmits<{
  saved: [];
}>();

const toast = useToast();
const formRef = ref<{ submit: () => Promise<void> } | null>(null);
const selectedLabel = ref('');
const mapLayoutKey = ref(0);
const warnedSupplierIds = ref(new Set<number>());

const state = reactive<RescueSupplierAssignFormState>({});

const latRef = computed(() => props.latitude);
const lngRef = computed(() => props.longitude);
const serviceTypeFilter = ref<SupplierServiceType | 'all'>('all');

const { queryParams, displayQueryParams, setViewport } = useSupplierMapViewport();

const {
  search,
  sort,
  suppliers,
  loading: searchLoading,
  errorMessage,
  distanceSortBlocked,
} = useRescueSupplierSearch({
  latitude: latRef,
  longitude: lngRef,
  serviceTypeFilter,
  fetchViewport: queryParams,
  displayViewport: displayQueryParams,
});

const { saveSupplier, isAssigning } = useRescueSupplierAssign(
  () => props.rescueId,
);

const modalTitle = computed(() =>
  props.currentSupplierId != null
    ? 'Cambiar proveedor'
    : 'Asignar proveedor',
);

const isBusy = computed(
  () => props.loading || isAssigning.value || searchLoading.value,
);

const selectedRow = computed(() =>
  state.supplier != null
    ? suppliers.value.find((s) => s.id === state.supplier)
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
} = useQuery<Record<string, unknown>, Error>({
  key: () => ['supplier-detail', state.supplier ?? null],
  query: async ({ signal }) =>
    $fetch<Record<string, unknown>>(`/api/supplier/detail/${state.supplier}/`, {
      signal,
    }),
  enabled: () => state.supplier != null && !listHasCoords.value,
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
  if (raw && state.supplier != null) {
    const lat = parseRescueCoord(
      raw.latitude != null ? String(raw.latitude) : null,
    );
    const lng = parseRescueCoord(
      raw.longitude != null ? String(raw.longitude) : null,
    );
    if (lat != null && lng != null) {
      const name =
        selectedLabel.value
        || String(raw.name ?? '').trim()
        || `Proveedor #${state.supplier}`;
      return { lat, lng, name };
    }
  }

  return null;
});

watch(open, (isOpen) => {
  if (isOpen) {
    state.supplier = props.currentSupplierId ?? undefined;
    selectedLabel.value = props.currentSupplierName?.trim() ?? '';
    search.value = '';
    warnedSupplierIds.value.clear();
    nextTick(() => {
      mapLayoutKey.value += 1;
      requestAnimationFrame(() => {
        mapLayoutKey.value += 1;
      });
    });
  }
});

watch(
  () => [state.supplier, selectedSupplierPin.value, detailAsyncStatus.value] as const,
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

function selectSupplier(row: RescueSupplierNearbyRow) {
  if (state.supplier === row.id) {
    state.supplier = undefined;
    selectedLabel.value = '';
    return;
  }
  state.supplier = row.id;
  selectedLabel.value = row.name;
}

function onMapSupplierSelect(supplierId: number) {
  const row = suppliers.value.find((item) => item.id === supplierId);
  if (row) {
    selectSupplier(row);
  }
}

async function onSubmit(event: FormSubmitEvent<z.infer<typeof rescueSupplierAssignSchema>>) {
  const body = rescueSupplierAssignToBody(event.data);

  const ok = await saveSupplier(body);
  if (ok) {
    open.value = false;
    emit('saved');
  }
}

async function onRemoveSupplier() {
  const ok = await saveSupplier({ supplier: null });
  if (ok) {
    open.value = false;
    emit('saved');
  }
}

function onSaveClick() {
  if (state.supplier == null) {
    toast.add({
      title: 'Selecciona un proveedor',
      color: 'error',
    });
    return;
  }
  void formRef.value?.submit();
}

const { modalProps, isMobile } = useResponsiveModal({ desktopMaxWidth: 'max-w-6xl' });

const assignSupplierModalProps = computed(() => ({
  ...modalProps.value,
  scrollable: isMobile.value ? modalProps.value.scrollable : false,
  ui: {
    ...modalProps.value.ui,
    body: 'flex-1 overflow-hidden p-4 sm:p-6',
  },
}));
</script>

<template>
  <UModal
    v-model:open="open"
    :dismissible="false"
    :title="modalTitle"
    description="Selecciona un proveedor de la lista o agrega uno nuevo."
    v-bind="assignSupplierModalProps"
  >
    <template #body>
      <UForm
        ref="formRef"
        :schema="rescueSupplierAssignSchema"
        :state="state"
        class="h-full min-h-0 min-w-0"
        @submit="onSubmit"
      >
        <UFormField name="supplier" class="hidden" />

        <OperationalRescueRequestRescueSupplierMapLayout>
          <template #list>
            <OperationalRescueRequestRescueSupplierPickerList
              v-model:search="search"
              v-model:service-type-filter="serviceTypeFilter"
              v-model:sort="sort"
              :suppliers="suppliers"
              :selected-id="state.supplier"
              :loading="searchLoading"
              :distance-sort-blocked="distanceSortBlocked"
              :error-message="errorMessage"
              distance-blocked-message="Este rescate no tiene ubicación para ordenar por distancia."
              empty-message="No hay proveedores que coincidan con la búsqueda."
              @select="selectSupplier"
            />
          </template>

          <template #map>
            <OperationalRescueRequestSupplierStepMap
              :key="mapLayoutKey"
              class="h-full min-h-48 w-full"
              :unit-latitude="latitude"
              :unit-longitude="longitude"
              :selected-supplier="selectedSupplierPin"
              :selected-supplier-id="state.supplier ?? null"
              :nearby-suppliers="suppliers"
              @viewport-change="setViewport"
              @select="onMapSupplierSelect"
            />
          </template>
        </OperationalRescueRequestRescueSupplierMapLayout>
      </UForm>
    </template>

    <template #footer>
      <div class="flex w-full flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <UButton
          v-if="currentSupplierId != null"
          class="w-full sm:w-auto"
          color="error"
          label="Quitar proveedor"
          variant="ghost"
          :loading="isAssigning"
          :disabled="isBusy"
          @click="onRemoveSupplier"
        />
        <div class="flex w-full flex-col gap-2 sm:ml-auto sm:w-auto sm:flex-row">
          <UButton
            color="neutral"
            label="Cancelar"
            variant="subtle"
            :disabled="isBusy"
            @click="() => { open = false }"
          />
          <UButton
            color="primary"
            icon="i-lucide-check"
            label="Confirmar"
            :loading="isAssigning"
            :disabled="isBusy"
            @click="onSaveClick"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
