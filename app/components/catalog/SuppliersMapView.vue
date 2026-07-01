<script setup lang="ts">
import { AdvancedMarker } from 'vue3-google-map';
import type { SupplierListItem } from '~/interfaces/catalogs/supplier';
import type { MapViewport } from '~/utils/map-viewport';

const props = defineProps<{
  suppliers: SupplierListItem[];
  layoutKey?: number;
}>();

const emit = defineEmits<{
  select: [id: number];
  viewportChange: [viewport: MapViewport];
}>();

const config = useRuntimeConfig();
const DEFAULT_CENTER = { lat: 19.432608, lng: -99.133209 };
const initialCenter = DEFAULT_CENTER;
const initialZoom = 11;

const suppliersRef = toRef(props, 'suppliers');
const { pins, suppliersWithoutCoords } = useSupplierMapPins(suppliersRef);

const sharedMapRef = ref<{ getMap: () => google.maps.Map | null } | null>(null);

const noCoordsHint = computed(() => {
  if (suppliersWithoutCoords.value > 0 && pins.value.length === 0) {
    return 'Ningún proveedor tiene ubicación registrada. Edita un proveedor y agrega coordenadas en el mapa.';
  }
  if (pins.value.length === 0) {
    return 'No hay proveedores con ubicación para mostrar en el mapa.';
  }
  return null;
});

watch(
  () => props.layoutKey,
  () => {
    nextTick(() => {
      const map = sharedMapRef.value?.getMap();
      if (map) {
        google.maps.event.trigger(map, 'resize');
      }
    });
  },
);

function onMapViewportChange() {
  const map = sharedMapRef.value?.getMap();
  const viewport = getMapViewport(map);
  if (viewport) {
    emit('viewportChange', viewport);
  }
}
</script>

<template>
  <div
    class="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-default"
  >
    <div
      v-if="!config.public.googleMapsApiKey"
      class="flex flex-1 items-center justify-center px-4 text-sm text-muted"
    >
      Configura `NUXT_PUBLIC_GOOGLE_MAPS_API_KEY` para ver el mapa de
      proveedores.
    </div>
    <template v-else>
      <SharedMap
        ref="sharedMapRef"
        :center="initialCenter"
        :zoom="initialZoom"
        map-class="min-h-0 flex-1 h-full w-full"
        @idle="onMapViewportChange"
        @bounds-changed="onMapViewportChange"
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
      </SharedMap>

      <div
        v-if="noCoordsHint"
        class="pointer-events-none absolute inset-x-3 bottom-3 rounded-lg border border-default bg-default/95 px-4 py-3 text-center text-sm text-muted shadow-sm"
      >
        {{ noCoordsHint }}
      </div>
    </template>
  </div>
</template>
