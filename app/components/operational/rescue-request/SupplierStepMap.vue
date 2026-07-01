<script setup lang="ts">
import { AdvancedMarker, GoogleMap } from 'vue3-google-map';
import type { RescueSupplierNearbyRow, SupplierMapPin } from '~/interfaces/rescue';
import type { MapViewport } from '~/utils/map-viewport';
import { parseRescueCoord } from '~/schemas/rescue-create';

const props = defineProps<{
  unitLatitude: string | null;
  unitLongitude: string | null;
  selectedSupplier: SupplierMapPin | null;
  selectedSupplierId?: number | null;
  nearbySuppliers?: RescueSupplierNearbyRow[];
}>();

const emit = defineEmits<{
  viewportChange: [viewport: MapViewport];
}>();

const config = useRuntimeConfig();
const mapId = '21013da77446513d35236d00';

const DEFAULT_CENTER = { lat: 19.432608, lng: -99.133209 };
const initialCenter = DEFAULT_CENTER;
const initialZoom = 11;

const mapRef = ref<{ map: google.maps.Map } | null>(null);

const unitPosition = computed(() => {
  const lat = parseRescueCoord(props.unitLatitude);
  const lng = parseRescueCoord(props.unitLongitude);
  if (lat == null || lng == null) return null;
  return { lat, lng };
});

const supplierPosition = computed(() => {
  if (!props.selectedSupplier) return null;
  return {
    lat: props.selectedSupplier.lat,
    lng: props.selectedSupplier.lng,
  };
});

const nearbyPins = computed(() =>
  (props.nearbySuppliers ?? []).flatMap((row) => {
    if (
      props.selectedSupplierId != null
      && row.id === props.selectedSupplierId
    ) {
      return [];
    }
    const lat = parseRescueCoord(
      row.latitude != null ? String(row.latitude) : null,
    );
    const lng = parseRescueCoord(
      row.longitude != null ? String(row.longitude) : null,
    );
    if (lat == null || lng == null) return [];
    return [{
      id: row.id,
      name: row.name,
      lat,
      lng,
      is_trusted: row.is_trusted,
    }];
  }),
);

function collectVisiblePoints(): { lat: number; lng: number }[] {
  const points: { lat: number; lng: number }[] = [];
  if (unitPosition.value) points.push(unitPosition.value);
  if (supplierPosition.value) points.push(supplierPosition.value);
  return points;
}

function fitToMarkers() {
  const map = mapRef.value?.map;
  if (!map) return;
  const points = collectVisiblePoints();
  if (points.length === 0) {
    map.panTo(DEFAULT_CENTER);
    map.setZoom(11);
    return;
  }
  fitMapToPoints(map, points);
}

watch(
  () => [unitPosition.value, supplierPosition.value] as const,
  () => {
    nextTick(() => fitToMarkers());
  },
  { deep: true },
);

function emitViewportChange() {
  const map = mapRef.value?.map;
  if (map) {
    google.maps.event.trigger(map, 'resize');
  }
  const viewport = getMapViewport(map);
  if (viewport) {
    emit('viewportChange', viewport);
  }
}
</script>

<template>
  <div class="h-full min-h-48 overflow-hidden rounded-lg border border-default lg:min-h-72">
    <div
      v-if="!config.public.googleMapsApiKey"
      class="flex h-full min-h-48 items-center justify-center px-4 text-sm text-muted lg:min-h-72"
    >
      Configura `NUXT_PUBLIC_GOOGLE_MAPS_API_KEY` para ver el mapa.
    </div>
    <ClientOnly v-else>
      <GoogleMap
        ref="mapRef"
        :map-id="mapId"
        :api-key="config.public.googleMapsApiKey"
        :center="initialCenter"
        :zoom="initialZoom"
        gesture-handling="greedy"
        class="h-full min-h-48 w-full lg:min-h-72"
        :map-type-control="false"
        :street-view-control="false"
        @idle="emitViewportChange"
        @bounds_changed="emitViewportChange"
      >
        <AdvancedMarker
          v-if="unitPosition"
          :options="{ position: unitPosition, title: 'Ubicación de la unidad' }"
          :pin-options="{
            background: '#fbbc04',
            borderColor: '#e6a800',
            glyphColor: '#ffffff',
          }"
        />

        <AdvancedMarker
          v-for="pin in nearbyPins"
          :key="pin.id"
          :options="{
            position: { lat: pin.lat, lng: pin.lng },
            title: pin.name,
          }"
          :pin-options="{
            background: pin.is_trusted ? '#f59e0b' : '#2563eb',
            borderColor: pin.is_trusted ? '#d97706' : '#1d4ed8',
            glyphColor: '#ffffff',
          }"
        />

        <AdvancedMarker
          v-if="supplierPosition && selectedSupplier"
          :options="{
            position: supplierPosition,
            title: selectedSupplier.name,
          }"
          :pin-options="{
            background: '#16a34a',
            borderColor: '#15803d',
            glyphColor: '#ffffff',
          }"
        />
      </GoogleMap>
    </ClientOnly>
  </div>
</template>
