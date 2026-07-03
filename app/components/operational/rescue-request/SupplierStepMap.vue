<script setup lang="ts">
import { AdvancedMarker, GoogleMap } from 'vue3-google-map';
import type { RescueSupplierNearbyRow, SupplierMapPin } from '~/interfaces/rescue';
import type { MapViewport } from '~/utils/map-viewport';
import { parseRescueCoord } from '~/schemas/rescue-create';
import {
  RESCUE_SUPPLIER_MAP_LEGEND,
  SUPPLIER_MAP_SELECTED_PIN,
  SUPPLIER_MAP_UNIT_PIN,
  trustedSupplierPinOptions,
} from '~/constants/supplier-map-pins';

const props = defineProps<{
  unitLatitude: string | null;
  unitLongitude: string | null;
  selectedSupplier: SupplierMapPin | null;
  selectedSupplierId?: number | null;
  nearbySuppliers?: RescueSupplierNearbyRow[];
}>();

const emit = defineEmits<{
  viewportChange: [viewport: MapViewport];
  select: [supplierId: number];
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

function onSelectedPinClick() {
  if (props.selectedSupplierId != null) {
    emit('select', props.selectedSupplierId);
  }
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
  <div class="relative h-full min-h-48 overflow-hidden rounded-lg border border-default lg:min-h-72">
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
          :pin-options="SUPPLIER_MAP_UNIT_PIN"
        />

        <AdvancedMarker
          v-for="pin in nearbyPins"
          :key="pin.id"
          :options="{
            position: { lat: pin.lat, lng: pin.lng },
            title: pin.name,
          }"
          :pin-options="trustedSupplierPinOptions(pin.is_trusted)"
          @click="emit('select', pin.id)"
        />

        <AdvancedMarker
          v-if="supplierPosition && selectedSupplier"
          :options="{
            position: supplierPosition,
            title: selectedSupplier.name,
          }"
          :pin-options="SUPPLIER_MAP_SELECTED_PIN"
          @click="onSelectedPinClick"
        />
      </GoogleMap>

      <SharedMapPinLegend :items="RESCUE_SUPPLIER_MAP_LEGEND" />
    </ClientOnly>
  </div>
</template>
