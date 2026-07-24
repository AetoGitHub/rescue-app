<script setup lang="ts">
import type { MapPlaceSelectPayload } from '~/interfaces/maps/geocoding';

const emit = defineEmits<{
  select: [payload: MapPlaceSelectPayload];
}>();

const inputRef = ref<HTMLInputElement | null>(null);
const failed = ref(false);

let autocomplete: google.maps.places.Autocomplete | null = null;
let placeListener: google.maps.MapsEventListener | null = null;

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

function detachAutocomplete() {
  if (placeListener) {
    placeListener.remove();
    placeListener = null;
  }
  autocomplete = null;
}

async function attachAutocomplete() {
  const input = inputRef.value;
  if (!input || autocomplete) return;

  const loaded = await waitForPlacesLibrary();
  if (!loaded || !inputRef.value) {
    failed.value = true;
    return;
  }

  detachAutocomplete();

  autocomplete = new google.maps.places.Autocomplete(inputRef.value, {
    fields: ['geometry', 'formatted_address', 'name'],
    componentRestrictions: { country: 'mx' },
  });

  placeListener = autocomplete.addListener('place_changed', () => {
    const place = autocomplete?.getPlace();
    const location = place?.geometry?.location;
    if (!location) return;

    const lat = location.lat();
    const lng = location.lng();
    const address =
      place.formatted_address?.trim()
      || place.name?.trim()
      || '';

    emit('select', { lat, lng, address });
  });

  failed.value = false;
}

onMounted(() => {
  void attachAutocomplete();
});

onBeforeUnmount(() => {
  detachAutocomplete();
});
</script>

<template>
  <div
    class="map-places-search m-2 w-[min(20rem,70vw)]"
    @mousedown.stop
    @click.stop
    @dblclick.stop
    @touchstart.stop
  >
    <div
      class="flex items-center gap-2 rounded-md border border-default bg-default px-2.5 py-1.5 shadow-md"
      :class="failed ? 'opacity-60' : ''"
    >
      <UIcon
        name="i-lucide-search"
        class="size-4 shrink-0 text-muted"
      />
      <input
        ref="inputRef"
        type="text"
        class="min-w-0 flex-1 border-0 bg-transparent text-sm text-highlighted outline-none placeholder:text-muted"
        placeholder="Buscar lugar…"
        autocomplete="off"
        :disabled="failed"
        :aria-label="failed ? 'Búsqueda de lugares no disponible' : 'Buscar lugar'"
      >
    </div>
  </div>
</template>

<style>
/* pac-container is appended to document.body; keep it above modals/maps. */
.pac-container {
  z-index: 100000 !important;
}
</style>
