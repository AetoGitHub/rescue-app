<script setup lang="ts">
import { watchDebounced } from '@vueuse/core';
import type { RescueRequestFormState } from '~/schemas/rescue-create';
import {
  fetchAddressFromCoords,
  readGeocodingLatLng,
} from '~/utils/maps-geocoding';

const state = defineModel<RescueRequestFormState>({ required: true });

const apiFetch = useApiFetch();
const toast = useToast();
const geocodingPending = ref(false);
let geocodingRequestId = 0;

async function resolveLocationDescription(coords: { lat: number; lng: number }) {
  const requestId = ++geocodingRequestId;
  geocodingPending.value = true;

  try {
    const response = await fetchAddressFromCoords(
      apiFetch,
      coords.lat,
      coords.lng,
    );
    if (requestId !== geocodingRequestId) return;

    const address = response.address?.trim();
    if (address) {
      state.value.location_description = address;
    }
  } catch (error) {
    if (requestId !== geocodingRequestId) return;
    toast.add({
      title: 'No se pudo obtener la dirección',
      description: getFetchErrorMessage(error),
      color: 'warning',
    });
  } finally {
    if (requestId === geocodingRequestId) {
      geocodingPending.value = false;
    }
  }
}

watchDebounced(
  () =>
    readGeocodingLatLng(
      state.value.location_latitude,
      state.value.location_longitude,
    ),
  (coords) => {
    if (coords == null) return;
    void resolveLocationDescription(coords);
  },
  { debounce: 400, maxWait: 1200 },
);
</script>

<template>
  <div class="space-y-4">
    <UFormField label="Ubicación de la unidad" name="location_latitude">
      <SharedLocationPicker
        v-model:latitude="state.location_latitude"
        v-model:longitude="state.location_longitude"
        latitude-name="location_latitude"
        longitude-name="location_longitude"
        empty-status-label="Indica la ubicación de la unidad (opcional)"
      />
    </UFormField>

    <UFormField label="Descripción del lugar" name="location_description">
      <div class="space-y-2">
        <UInput v-model="state.location_description" class="w-full" />
        <p
          v-if="geocodingPending"
          class="flex items-center gap-2 text-xs text-muted"
        >
          <UIcon name="i-lucide-loader-circle" class="size-3.5 animate-spin" />
          Obteniendo dirección…
        </p>
      </div>
    </UFormField>
  </div>
</template>
