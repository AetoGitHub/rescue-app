<script setup lang="ts">
import { AdvancedMarker } from 'vue3-google-map';

const latitude = defineModel<string | null>('latitude', { default: null });
const longitude = defineModel<string | null>('longitude', { default: null });

const props = withDefaults(
  defineProps<{
    requestInitialLocation?: boolean;
  }>(),
  {
    requestInitialLocation: false,
  },
);

const config = useRuntimeConfig();
const toast = useToast();

const DEFAULT_CENTER = { lat: 19.432608, lng: -99.133209 };
const mapCenter = ref({ ...DEFAULT_CENTER });
const geolocationPending = ref(false);

function parseCoordinate(value: string | null | undefined): number | undefined {
  if (value == null) return undefined;
  const trimmed = String(value).trim();
  if (trimmed === '') return undefined;
  const parsed = Number(trimmed.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : undefined;
}

const hasCoordinates = computed(() => {
  return (
    parseCoordinate(latitude.value) != null &&
    parseCoordinate(longitude.value) != null
  );
});

const markerLatLng = computed(() => {
  const lat = parseCoordinate(latitude.value);
  const lng = parseCoordinate(longitude.value);
  if (lat != null && lng != null) {
    return { lat, lng };
  }
  return null;
});

function setCoordinates(lat: number, lng: number) {
  latitude.value = lat.toFixed(6);
  longitude.value = lng.toFixed(6);
  mapCenter.value = { lat, lng };
}

function onMapClick(event: google.maps.MapMouseEvent) {
  const lat = event.latLng?.lat();
  const lng = event.latLng?.lng();
  if (lat == null || lng == null) return;
  setCoordinates(lat, lng);
}

function onMarkerDragEnd(event: google.maps.MapMouseEvent) {
  onMapClick(event);
}

function syncMapCenterFromModel() {
  const lat = parseCoordinate(latitude.value);
  const lng = parseCoordinate(longitude.value);
  if (lat != null && lng != null) {
    mapCenter.value = { lat, lng };
  } else {
    mapCenter.value = { ...DEFAULT_CENTER };
  }
}

async function requestCurrentLocation() {
  if (!import.meta.client || !navigator.geolocation) {
    toast.add({
      title: 'Geolocalización no disponible',
      description: 'Tu navegador no permite obtener la ubicación actual.',
      color: 'warning',
    });
    return;
  }

  geolocationPending.value = true;
  try {
    const position = await new Promise<GeolocationPosition>(
      (resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      },
    );
    setCoordinates(position.coords.latitude, position.coords.longitude);
  } catch (error) {
    console.error(error);
    toast.add({
      title: 'No se pudo obtener tu ubicación',
      description:
        'Marca el punto haciendo clic en el mapa o vuelve a intentarlo.',
      color: 'warning',
    });
  } finally {
    geolocationPending.value = false;
  }
}

watch(
  () => [latitude.value, longitude.value],
  () => {
    syncMapCenterFromModel();
  },
  { immediate: true },
);

watch(
  () => props.requestInitialLocation,
  (shouldRequest) => {
    if (!shouldRequest || hasCoordinates.value) return;
    void requestCurrentLocation();
  },
  { immediate: true },
);
</script>

<template>
  <div class="space-y-3">
    <div
      v-if="!config.public.googleMapsApiKey"
      class="rounded-lg border border-dashed border-default px-4 py-6 text-sm text-muted"
    >
      Configura `NUXT_PUBLIC_GOOGLE_MAPS_API_KEY` para seleccionar la ubicación
      en el mapa.
    </div>
    <template v-else>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <p class="text-sm text-muted">
          Haz clic en el mapa para marcar la ubicación.
        </p>
        <UButton
          type="button"
          size="sm"
          variant="subtle"
          icon="i-lucide-locate-fixed"
          label="Usar mi ubicación"
          :loading="geolocationPending"
          :disabled="geolocationPending"
          @click="requestCurrentLocation"
        />
      </div>
      <div class="h-72 overflow-hidden rounded-lg border border-default">
        <SharedMap
          :center="mapCenter"
          :zoom="14"
          map-class="h-72 w-full"
          @click="onMapClick"
        >
          <AdvancedMarker
            v-if="markerLatLng"
            :options="{
              position: markerLatLng,
            }"
            @dragend="onMarkerDragEnd"
          />
        </SharedMap>
      </div>
      <p v-if="hasCoordinates" class="text-xs text-muted">
        Latitud: {{ latitude }} · Longitud: {{ longitude }}
      </p>
    </template>
  </div>
</template>
