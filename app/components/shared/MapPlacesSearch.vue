<script setup lang="ts">
import { refDebounced } from '@vueuse/core';
import type { MapPlaceSelectPayload } from '~/interfaces/maps/geocoding';

interface PlacePredictionItem {
  id: string;
  label: string;
  description?: string;
}

const emit = defineEmits<{
  select: [payload: MapPlaceSelectPayload];
}>();

const selected = ref<PlacePredictionItem | undefined>();
const searchTerm = ref('');
const debouncedSearch = refDebounced(searchTerm, 300);
const items = ref<PlacePredictionItem[]>([]);
const loading = ref(false);
const resolving = ref(false);
const failed = ref(false);

let autocompleteService: google.maps.places.AutocompleteService | null = null;
let placesService: google.maps.places.PlacesService | null = null;
let placesHost: HTMLDivElement | null = null;
let searchRequestId = 0;

async function waitForPlacesLibrary(attempt = 0): Promise<boolean> {
  if (!import.meta.client) return false;

  try {
    if (typeof google !== 'undefined' && google.maps?.importLibrary) {
      await google.maps.importLibrary('places');
      return true;
    }
  } catch (error) {
    console.error('[MapPlacesSearch] Failed to load places library', error);
    return false;
  }

  if (attempt >= 40) return false;
  await new Promise((resolve) => window.setTimeout(resolve, 100));
  return waitForPlacesLibrary(attempt + 1);
}

async function ensurePlacesServices(): Promise<boolean> {
  if (autocompleteService && placesService) return true;

  const loaded = await waitForPlacesLibrary();
  if (!loaded) {
    failed.value = true;
    return false;
  }

  autocompleteService = new google.maps.places.AutocompleteService();
  placesHost = document.createElement('div');
  placesService = new google.maps.places.PlacesService(placesHost);
  failed.value = false;
  return true;
}

function getPlacePredictions(
  input: string,
): Promise<google.maps.places.AutocompletePrediction[]> {
  return new Promise((resolve) => {
    if (!autocompleteService) {
      resolve([]);
      return;
    }

    autocompleteService.getPlacePredictions(
      {
        input,
        componentRestrictions: { country: 'mx' },
      },
      (predictions, status) => {
        if (
          status !== google.maps.places.PlacesServiceStatus.OK
          || !predictions?.length
        ) {
          resolve([]);
          return;
        }
        resolve(predictions);
      },
    );
  });
}

function getPlaceDetails(
  placeId: string,
): Promise<google.maps.places.PlaceResult | null> {
  return new Promise((resolve) => {
    if (!placesService) {
      resolve(null);
      return;
    }

    placesService.getDetails(
      {
        placeId,
        fields: ['geometry', 'formatted_address', 'name'],
      },
      (place, status) => {
        if (
          status !== google.maps.places.PlacesServiceStatus.OK
          || !place
        ) {
          resolve(null);
          return;
        }
        resolve(place);
      },
    );
  });
}

async function searchPlaces(term: string) {
  const requestId = ++searchRequestId;
  const trimmed = term.trim();

  if (trimmed.length < 2) {
    items.value = [];
    loading.value = false;
    return;
  }

  loading.value = true;
  const ready = await ensurePlacesServices();
  if (!ready || requestId !== searchRequestId) {
    if (requestId === searchRequestId) loading.value = false;
    return;
  }

  try {
    const predictions = await getPlacePredictions(trimmed);
    if (requestId !== searchRequestId) return;

    items.value = predictions.map((prediction) => ({
      id: prediction.place_id,
      label:
        prediction.structured_formatting?.main_text?.trim()
        || prediction.description,
      description:
        prediction.structured_formatting?.secondary_text?.trim()
        || prediction.description,
    }));
  } finally {
    if (requestId === searchRequestId) {
      loading.value = false;
    }
  }
}

watch(debouncedSearch, (term) => {
  void searchPlaces(term);
});

watch(selected, async (item) => {
  if (!item?.id) return;

  resolving.value = true;
  try {
    const ready = await ensurePlacesServices();
    if (!ready) return;

    const place = await getPlaceDetails(item.id);
    const location = place?.geometry?.location;
    if (!location) return;

    const address =
      place.formatted_address?.trim()
      || place.name?.trim()
      || item.label;

    emit('select', {
      lat: location.lat(),
      lng: location.lng(),
      address,
    });
  } finally {
    resolving.value = false;
  }
});

onMounted(() => {
  void ensurePlacesServices();
});

onBeforeUnmount(() => {
  autocompleteService = null;
  placesService = null;
  placesHost = null;
});
</script>

<template>
  <UInputMenu
    v-model="selected"
    v-model:search-term="searchTerm"
    :items="items"
    ignore-filter
    by="id"
    label-key="label"
    description-key="description"
    :loading="loading || resolving"
    :disabled="failed"
    icon="i-lucide-search"
    placeholder="Buscar lugar…"
    size="sm"
    variant="subtle"
    clear
    open-on-focus
    class="w-full"
    :portal="true"
    :ui="{
      base: 'bg-default shadow-md',
      content: 'z-[100000]',
    }"
    :content="{
      side: 'bottom',
      sideOffset: 4,
    }"
    :aria-label="failed ? 'Búsqueda de lugares no disponible' : 'Buscar lugar'"
  >
    <template #empty>
      <p class="px-2 py-1.5 text-sm text-muted">
        {{
          failed
            ? 'Búsqueda no disponible'
            : searchTerm.trim().length < 2
              ? 'Escribe al menos 2 caracteres'
              : loading
                ? 'Buscando…'
                : 'Sin resultados'
        }}
      </p>
    </template>
  </UInputMenu>
</template>
