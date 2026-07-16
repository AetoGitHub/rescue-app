<script setup lang="ts">
import {
  formatCoordinateString,
  formatLatLngPair,
  parseGoogleMapsUrl,
  parseLatLngPair,
} from '~/utils/google-maps-link';
import {
  fetchCoordsFromMapsLink,
  readGeocodingLatLng,
} from '~/utils/maps-geocoding';

const props = withDefaults(
  defineProps<{
    mapLayoutKey?: number;
    latitudeName?: string;
    longitudeName?: string;
    emptyStatusLabel?: string;
    mapHint?: string;
  }>(),
  {
    mapLayoutKey: undefined,
    latitudeName: 'latitude',
    longitudeName: 'longitude',
    emptyStatusLabel: 'Sin ubicación definida',
    mapHint:
      'Haz clic en el mapa para colocar el pin. Puedes arrastrarlo para ajustar.',
  },
);

const latitude = defineModel<string | null>('latitude', { default: null });
const longitude = defineModel<string | null>('longitude', { default: null });

const emit = defineEmits<{
  coordinatesChange: [coords: { lat: number; lng: number }];
}>();

const apiFetch = useApiFetch();
const toast = useToast();

const locationTab = ref('link');
const mapsLink = ref('');
const mapRemountKey = ref(0);
const linkResolving = ref(false);
const coordinatesInput = ref('');
const mapPinPickerRef = ref<{ recenterFromModel: () => void } | null>(null);

const locationTabItems = [
  {
    label: 'Link de Google Maps',
    icon: 'i-lucide-link',
    slot: 'link' as const,
    value: 'link',
  },
  {
    label: 'Coordenadas',
    icon: 'i-lucide-crosshair',
    slot: 'coords' as const,
    value: 'coords',
  },
];

watch(
  () => props.mapLayoutKey,
  () => {
    mapRemountKey.value += 1;
    nextTick(() => {
      window.setTimeout(() => mapPinPickerRef.value?.recenterFromModel(), 150);
    });
  },
);

const hasCoordinates = computed(() =>
  readGeocodingLatLng(latitude.value, longitude.value) != null,
);

const locationStatusLabel = computed(() => {
  if (!hasCoordinates.value) {
    return props.emptyStatusLabel;
  }
  return `Ubicación: ${latitude.value}, ${longitude.value}`;
});

function syncCoordinatesInputFromModel() {
  const coords = readGeocodingLatLng(latitude.value, longitude.value);
  coordinatesInput.value =
    coords == null ? '' : formatLatLngPair(coords.lat, coords.lng);
}

function notifyCoordinatesChange() {
  const coords = readGeocodingLatLng(latitude.value, longitude.value);
  if (coords == null) return;
  emit('coordinatesChange', coords);
}

function applyParsedCoordinates(lat: number, lng: number) {
  latitude.value = formatCoordinateString(lat);
  longitude.value = formatCoordinateString(lng);
  coordinatesInput.value = formatLatLngPair(lat, lng);
  nextTick(() => mapPinPickerRef.value?.recenterFromModel());
  notifyCoordinatesChange();
}

async function applyMapsLink() {
  const trimmed = mapsLink.value.trim();
  if (trimmed === '') {
    toast.add({
      title: 'Pega un enlace de Google Maps',
      color: 'warning',
    });
    return;
  }

  linkResolving.value = true;
  try {
    const response = await fetchCoordsFromMapsLink(apiFetch, trimmed);
    applyParsedCoordinates(response.lat, response.lng);
    toast.add({ title: 'Coordenadas aplicadas', color: 'success' });
  } catch {
    const parsed = parseGoogleMapsUrl(trimmed);
    if (parsed == null) {
      toast.add({
        title: 'No se pudo leer el enlace',
        description:
          'Verifica el enlace o usa coordenadas / marcar en el mapa.',
        color: 'warning',
      });
      return;
    }
    applyParsedCoordinates(parsed.lat, parsed.lng);
    toast.add({ title: 'Coordenadas aplicadas', color: 'success' });
  } finally {
    linkResolving.value = false;
  }
}

function onCoordinatesInput(value: string | number | null | undefined) {
  const raw = value == null ? '' : String(value);
  coordinatesInput.value = raw;

  const trimmed = raw.trim();
  if (trimmed === '') {
    latitude.value = latitude.value == null ? null : '';
    longitude.value = longitude.value == null ? null : '';
    return;
  }

  const parsed = parseLatLngPair(trimmed);
  if (parsed == null) return;
  applyParsedCoordinates(parsed.lat, parsed.lng);
}

function clearCoordinates() {
  latitude.value = latitude.value == null ? null : '';
  longitude.value = longitude.value == null ? null : '';
  coordinatesInput.value = '';
  mapsLink.value = '';
}

watch(
  () => [latitude.value, longitude.value] as const,
  () => {
    syncCoordinatesInputFromModel();
    notifyCoordinatesChange();
  },
  { immediate: true },
);
</script>

<template>
  <div class="space-y-4">
    <div class="min-h-72">
      <p class="mb-2 text-sm text-muted">
        {{ mapHint }}
      </p>
      <SharedMapPinPicker
        ref="mapPinPickerRef"
        :key="`location-map-${mapRemountKey}`"
        v-model:latitude="latitude"
        v-model:longitude="longitude"
      />
    </div>

    <UTabs
      v-model="locationTab"
      :items="locationTabItems"
      :unmount-on-hide="false"
      class="w-full"
    >
      <template #link>
        <div class="flex flex-col gap-3 pt-2">
          <UFormField label="Enlace de Google Maps">
            <UInput
              v-model="mapsLink"
              class="w-full"
              placeholder="https://maps.google.com/..."
              icon="i-lucide-link"
            />
          </UFormField>
          <UButton
            type="button"
            label="Extraer coordenadas del enlace"
            variant="subtle"
            icon="i-lucide-map-pin"
            :loading="linkResolving"
            :disabled="linkResolving"
            @click="applyMapsLink"
          />
        </div>
      </template>

      <template #coords>
        <div class="pt-2">
          <UFormField label="Coordenadas" :name="latitudeName">
            <UInput
              :model-value="coordinatesInput"
              class="w-full"
              placeholder="18.074964, -94.322692"
              icon="i-lucide-crosshair"
              @update:model-value="onCoordinatesInput"
            />
          </UFormField>
          <!-- Keep longitude in the form tree for Zod / UForm error binding -->
          <UFormField v-show="false" :name="longitudeName" />
          <p class="mt-1.5 text-xs text-muted">
            Formato: latitud, longitud (ej. 18.0749639676887, -94.32269235997158)
          </p>
        </div>
      </template>
    </UTabs>

    <div
      class="flex items-center gap-2 rounded-lg border border-default bg-muted/30 px-3 py-2 text-sm text-muted"
    >
      <UIcon name="i-lucide-map-pin" class="size-4 shrink-0" />
      <span class="min-w-0 flex-1">{{ locationStatusLabel }}</span>
      <UButton
        v-if="hasCoordinates"
        type="button"
        size="xs"
        color="neutral"
        variant="ghost"
        label="Quitar"
        @click="clearCoordinates"
      />
    </div>
  </div>
</template>
