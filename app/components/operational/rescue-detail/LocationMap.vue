<script setup lang="ts">
import { useQuery } from '@pinia/colada';
import { AdvancedMarker, GoogleMap } from 'vue3-google-map';
import type { RescueCardDetail } from '~/interfaces/rescue';
import {
  RESCUE_DETAIL_ROUTE_MAP_LEGEND,
  SUPPLIER_MAP_SELECTED_PIN,
  SUPPLIER_MAP_UNIT_PIN,
} from '~/constants/supplier-map-pins';

const props = withDefaults(
  defineProps<{
    detail: RescueCardDetail;
    editable?: boolean;
  }>(),
  {
    editable: true,
  },
);

const emit = defineEmits<{
  edit: [];
}>();

const config = useRuntimeConfig();
const mapId = '21013da77446513d35236d00';

const mapRef = ref<{ map: google.maps.Map } | null>(null);
let routePolylines: google.maps.Polyline[] = [];
let routeRequestId = 0;
let fitRetryTimer: ReturnType<typeof setTimeout> | null = null;
let lastRouteKey = '';
let mapHasSynced = false;

const unitPosition = computed(() =>
  parseRescueCoordinates(props.detail.latitude, props.detail.longitude),
);

const hasMapPosition = computed(() => unitPosition.value != null);

const supplierId = computed(() => props.detail.supplier_id);

const {
  data: supplierDetail,
} = useQuery<Record<string, unknown>, Error>({
  key: () => ['supplier-detail', supplierId.value],
  query: async ({ signal }) =>
    $fetch<Record<string, unknown>>(
      `/api/supplier/detail/${supplierId.value}/`,
      { signal },
    ),
  enabled: () => supplierId.value != null,
});

const supplierPosition = computed(() => {
  const raw = supplierDetail.value;
  if (raw == null) return null;
  return parseRescueCoordinates(
    raw.latitude != null ? String(raw.latitude) : null,
    raw.longitude != null ? String(raw.longitude) : null,
  );
});

const supplierTitle = computed(() => {
  const name = props.detail.supplier_name?.trim();
  if (name) return name;
  if (supplierId.value != null) return `Proveedor #${supplierId.value}`;
  return 'Proveedor';
});

const showRouteLegend = computed(
  () => unitPosition.value != null && supplierPosition.value != null,
);

const coordinatesLabel = computed(() => {
  if (!unitPosition.value) return '—';
  return `${unitPosition.value.lat.toFixed(5)}, ${unitPosition.value.lng.toFixed(5)}`;
});

const locationDescription = computed(() =>
  formatDetailDescription(props.detail.location_description),
);

const locationActionLabel = computed(() =>
  hasMapPosition.value ? 'Editar' : 'Agregar',
);

const locationActionIcon = computed(() =>
  hasMapPosition.value ? 'i-lucide-pencil' : 'i-lucide-map-pin-plus',
);

function clearFitRetry() {
  if (fitRetryTimer != null) {
    clearTimeout(fitRetryTimer);
    fitRetryTimer = null;
  }
}

function routeKeyFor(
  origin: { lat: number; lng: number } | null,
  destination: { lat: number; lng: number } | null,
) {
  if (origin == null || destination == null) return '';
  return `${origin.lat},${origin.lng}|${destination.lat},${destination.lng}`;
}

function clearRoute() {
  clearRoutePolylines(routePolylines);
  routePolylines = [];
  lastRouteKey = '';
}

function fitMarkers(attempt = 0) {
  const map = mapRef.value?.map;
  if (!map) {
    if (attempt < 20) {
      clearFitRetry();
      fitRetryTimer = setTimeout(() => fitMarkers(attempt + 1), 80);
    }
    return;
  }
  clearFitRetry();

  const points = [unitPosition.value, supplierPosition.value].filter(
    (point): point is { lat: number; lng: number } => point != null,
  );
  if (points.length === 0) return;
  fitMapToPoints(map, points);
}

async function syncRoute() {
  const map = mapRef.value?.map;
  const origin = unitPosition.value;
  const destination = supplierPosition.value;
  const nextKey = routeKeyFor(origin, destination);
  const requestId = ++routeRequestId;

  if (map == null || origin == null || destination == null) {
    clearRoute();
    return;
  }

  if (nextKey === lastRouteKey && routePolylines.length > 0) {
    return;
  }

  const route = await requestDrivingRoute(origin, destination);
  if (requestId !== routeRequestId) return;

  clearRoute();

  if (route == null) {
    return;
  }

  routePolylines = drawDrivingRoutePolylines(map, route);
  lastRouteKey = nextKey;
}

function onMapIdle() {
  const map = mapRef.value?.map;
  if (map) {
    google.maps.event.trigger(map, 'resize');
  }
  if (mapHasSynced) return;
  mapHasSynced = true;
  fitMarkers();
  void syncRoute();
}

watch(
  () => [unitPosition.value, supplierPosition.value] as const,
  () => {
    lastRouteKey = '';
    nextTick(() => {
      fitMarkers();
      void syncRoute();
    });
  },
  { deep: true },
);

onBeforeUnmount(() => {
  clearFitRetry();
  routeRequestId += 1;
  mapHasSynced = false;
  clearRoute();
});
</script>

<template>
  <section class="space-y-3 rounded-lg border border-default bg-default p-4">
    <div class="flex items-center justify-between gap-2">
      <h3 class="text-xs font-semibold uppercase tracking-wider text-muted">
        Ubicación
      </h3>
      <UButton
        v-if="editable"
        color="neutral"
        :icon="locationActionIcon"
        :label="locationActionLabel"
        size="xs"
        variant="ghost"
        @click="emit('edit')"
      />
    </div>

    <div
      v-if="hasMapPosition"
      class="space-y-2"
    >
      <SharedMapPinLegend
        v-if="showRouteLegend"
        inline
        :items="RESCUE_DETAIL_ROUTE_MAP_LEGEND"
      />
      <div class="relative h-44 overflow-hidden rounded-lg border border-default">
        <ClientOnly>
          <GoogleMap
            v-if="config.public.googleMapsApiKey && unitPosition"
            ref="mapRef"
            :map-id="mapId"
            :api-key="config.public.googleMapsApiKey"
            :center="unitPosition"
            :zoom="13"
            class="h-full w-full"
            :map-type-control="false"
            :street-view-control="false"
            :fullscreen-control="false"
            gesture-handling="cooperative"
            @idle="onMapIdle"
          >
            <AdvancedMarker
              :options="{
                position: unitPosition,
                title: 'Ubicación del rescate',
              }"
              :pin-options="SUPPLIER_MAP_UNIT_PIN"
            />
            <AdvancedMarker
              v-if="supplierPosition"
              :options="{
                position: supplierPosition,
                title: supplierTitle,
              }"
              :pin-options="SUPPLIER_MAP_SELECTED_PIN"
            />
          </GoogleMap>
          <div
            v-else
            class="flex h-full items-center justify-center text-xs text-muted"
          >
            Mapa no disponible
          </div>
        </ClientOnly>
      </div>
    </div>
    <div
      v-else
      class="flex flex-col items-center gap-3 rounded-lg border border-dashed border-default px-3 py-6 text-center"
    >
      <p class="text-xs text-muted">
        Sin ubicación registrada
      </p>
      <UButton
        v-if="editable"
        color="primary"
        variant="soft"
        size="sm"
        icon="i-lucide-map-pin-plus"
        label="Agregar ubicación"
        @click="emit('edit')"
      />
    </div>

    <div class="space-y-0.5">
      <p class="text-xs font-medium uppercase text-muted">
        Descripción del lugar
      </p>
      <p class="text-xs text-highlighted line-clamp-2">
        {{ locationDescription }}
      </p>
    </div>
    <p class="text-xs font-mono text-muted">
      {{ coordinatesLabel }}
    </p>
  </section>
</template>
