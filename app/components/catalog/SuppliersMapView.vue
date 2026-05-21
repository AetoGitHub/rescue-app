<script setup lang="ts">
import { GoogleMap, AdvancedMarker } from 'vue3-google-map';
import type { Supplier } from '~/interfaces/catalogs/supplier';

const props = defineProps<{
  suppliers: Supplier[];
}>();

const emit = defineEmits<{
  select: [id: number];
}>();

const config = useRuntimeConfig();
const mapId = '21013da77446513d35236d00';
const DEFAULT_CENTER = { lat: 19.432608, lng: -99.133209 };
const initialCenter = DEFAULT_CENTER;
const initialZoom = 11;

const mapRef = ref<{ map: google.maps.Map } | null>(null);

function parseCoord(value: string | number | null | undefined): number | null {
  if (value == null) return null;
  const parsed = Number(String(value).trim().replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

const pins = computed(() =>
  props.suppliers
    .map((supplier) => {
      const lat = parseCoord(supplier.latitude);
      const lng = parseCoord(supplier.longitude);
      if (lat == null || lng == null) return null;
      return {
        id: supplier.id,
        name: supplier.name,
        lat,
        lng,
        is_trusted: supplier.is_trusted,
      };
    })
    .filter((pin): pin is NonNullable<typeof pin> => pin != null),
);

function fitAllPins() {
  const map = mapRef.value?.map;
  if (!map || pins.value.length === 0) return;
  fitMapToPoints(
    map,
    pins.value.map((pin) => ({ lat: pin.lat, lng: pin.lng })),
  );
}

watch(
  pins,
  () => {
    nextTick(() => fitAllPins());
  },
  { deep: true },
);

function onMapIdle() {
  const map = mapRef.value?.map;
  if (map) {
    google.maps.event.trigger(map, 'resize');
  }
}
</script>

<template>
  <div
    class="h-[min(32rem,70vh)] overflow-hidden rounded-lg border border-default"
  >
    <div
      v-if="!config.public.googleMapsApiKey"
      class="flex h-full items-center justify-center px-4 text-sm text-muted"
    >
      Configura `NUXT_PUBLIC_GOOGLE_MAPS_API_KEY` para ver el mapa de
      proveedores.
    </div>
    <div
      v-else-if="pins.length === 0"
      class="flex h-full items-center justify-center px-4 text-center text-sm text-muted"
    >
      No hay proveedores con ubicación para mostrar en el mapa.
    </div>
    <GoogleMap
      v-else
      ref="mapRef"
      :api-key="config.public.googleMapsApiKey"
      :map-id="mapId"
      :center="initialCenter"
      :zoom="initialZoom"
      class="h-full w-full"
      @idle="onMapIdle"
    >
      <AdvancedMarker
        v-for="pin in pins"
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
        @click="emit('select', pin.id)"
      />
    </GoogleMap>
  </div>
</template>
