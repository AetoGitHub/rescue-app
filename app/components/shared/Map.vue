<script setup lang="ts">
import { GoogleMap } from 'vue3-google-map';

type LatLng = {
  lat: number;
  lng: number;
};

withDefaults(
  defineProps<{
    center?: LatLng;
    zoom?: number;
    gestureHandling?: 'auto' | 'cooperative' | 'greedy' | 'none';
    mapClass?: string;
  }>(),
  {
    center: () => ({ lat: 19.432608, lng: -99.133209 }),
    zoom: 10,
    gestureHandling: 'greedy',
    mapClass: 'h-full w-full',
  },
);

const emit = defineEmits<{
  click: [event: google.maps.MapMouseEvent];
  idle: [];
  boundsChanged: [];
}>();

const config = useRuntimeConfig();

const mapId = '21013da77446513d35236d00';
const mapRef = ref<{ map: google.maps.Map } | null>(null);

function onIdle() {
  const map = mapRef.value?.map;
  if (map) {
    google.maps.event.trigger(map, 'resize');
  }
  emit('idle');
}

function onBoundsChanged() {
  emit('boundsChanged');
}

function getMap(): google.maps.Map | null {
  return mapRef.value?.map ?? null;
}

defineExpose({ getMap });
</script>

<template>
  <ClientOnly>
    <div
      v-if="config.public.googleMapsApiKey"
      :class="mapClass"
    >
      <GoogleMap
        ref="mapRef"
        :map-id="mapId"
        :api-key="config.public.googleMapsApiKey"
        :center="center"
        :zoom="zoom"
        :gesture-handling="gestureHandling"
        class="h-full w-full"
        :map-type-control="false"
        :street-view-control="false"
        @click="emit('click', $event)"
        @idle="onIdle"
        @bounds_changed="onBoundsChanged"
      >
        <slot />
      </GoogleMap>
    </div>
    <template #fallback>
      <div
        :class="mapClass"
        class="flex min-h-48 items-center justify-center rounded-lg border border-dashed border-default px-4 text-sm text-muted"
      >
        Cargando mapa…
      </div>
    </template>
  </ClientOnly>
</template>
