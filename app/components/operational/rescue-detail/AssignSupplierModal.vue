<script setup lang="ts">
import { useQuery } from '@pinia/colada';
import type { FormSubmitEvent } from '@nuxt/ui';
import type { RescueSupplierNearbyRow, SupplierMapPin } from '~/interfaces/rescue';
import type { SupplierServiceType } from '~/interfaces/catalogs/supplier';
import { SUPPLIER_SERVICE_TYPE_OPTIONS } from '~/constants/catalog-select-options';
import { RESCUE_SUPPLIER_SORT_OPTIONS } from '~/constants/rescue-select-options';
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

const serviceTypeFilterItems = [
  { label: 'Todos los tipos', value: 'all' as const },
  ...SUPPLIER_SERVICE_TYPE_OPTIONS,
];

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

function clearSelection() {
  state.supplier = undefined;
  selectedLabel.value = '';
  warnedSupplierIds.value.clear();
}

function formatDistance(km: number | null) {
  if (km == null || !Number.isFinite(km)) return '—';
  return `${km.toFixed(1)} km`;
}

function formatRanking(value: number) {
  if (!Number.isFinite(value) || value <= 0) return '—';
  return value.toFixed(1);
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

const { modalProps } = useResponsiveModal({ desktopMaxWidth: 'max-w-6xl' });
</script>

<template>
  <UModal
    v-model:open="open"
    :dismissible="false"
    :title="modalTitle"
    v-bind="modalProps"
  >
    <template #body>
      <UForm
        ref="formRef"
        :schema="rescueSupplierAssignSchema"
        :state="state"
        @submit="onSubmit"
      >
        <UFormField name="supplier" class="hidden" />

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
              Este rescate no tiene ubicación para ordenar por distancia.
            </p>

            <div
              v-if="state.supplier != null"
              class="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm"
            >
              <span>
                Seleccionado:
                <strong>{{ selectedLabel || `#${state.supplier}` }}</strong>
              </span>
              <UButton
                type="button"
                size="xs"
                color="neutral"
                variant="ghost"
                label="Quitar"
                @click="clearSelection"
              />
            </div>

            <div class="min-h-0 flex-1 overflow-y-auto rounded-lg border border-default">
              <div
                v-if="searchLoading"
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
                Indica la ubicación del rescate para ver proveedores ordenados
                por distancia.
              </p>
              <p
                v-else-if="suppliers.length === 0"
                class="px-4 py-8 text-center text-sm text-muted"
              >
                No hay proveedores que coincidan con la búsqueda.
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
          </div>

          <OperationalRescueRequestSupplierStepMap
            :key="mapLayoutKey"
            class="order-1 h-[40vh] min-h-48 lg:order-2 lg:h-full lg:min-h-72"
            :unit-latitude="latitude"
            :unit-longitude="longitude"
            :selected-supplier="selectedSupplierPin"
          />
        </div>
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
            label="Guardar"
            :loading="isAssigning"
            :disabled="isBusy"
            @click="onSaveClick"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
