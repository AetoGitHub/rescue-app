<script setup lang="ts">
import { GoogleMap } from 'vue3-google-map';

type LatLng = {
  lat: number;
  lng: number;
};

const props = withDefaults(
  defineProps<{
    center?: LatLng;
    zoom?: number;
    gestureHandling?: 'auto' | 'cooperative' | 'greedy' | 'none';
    mapClass?: string;
  }>(),
  {
    center: () => ({ lat: 19.432608, lng: -99.133209 }),
    zoom: 14,
    gestureHandling: 'greedy',
    mapClass: 'h-full w-full',
  },
);

const emit = defineEmits<{
  click: [event: google.maps.MapMouseEvent];
  idle: [];
}>();

const config = useRuntimeConfig();
</script>

<template>
  <ClientOnly>
    <GoogleMap
      v-if="config.public.googleMapsApiKey"
      :api-key="config.public.googleMapsApiKey"
      :center="center"
      :zoom="zoom"
      :gesture-handling="gestureHandling"
      :class="mapClass"
      @click="emit('click', $event)"
      @idle="emit('idle')"
    >
      <slot />
    </GoogleMap>
  </ClientOnly>
</template>
