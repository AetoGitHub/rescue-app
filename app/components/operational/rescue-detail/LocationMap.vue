<script setup lang="ts">
import { AdvancedMarker, GoogleMap } from 'vue3-google-map';
import type { RescueCardDetail } from '~/interfaces/rescue';

const props = defineProps<{
  detail: RescueCardDetail;
}>();

const config = useRuntimeConfig();
const mapId = '21013da77446513d35236d00';

const position = computed(() =>
  parseRescueCoordinates(props.detail.latitude, props.detail.longitude),
);

const mapCenter = computed(() => position.value ?? { lat: 19.432608, lng: -99.133209 });

const coordinatesLabel = computed(() => {
  if (!position.value) return '—';
  return `${position.value.lat.toFixed(5)}, ${position.value.lng.toFixed(5)}`;
});

const locationDescription = computed(() =>
  formatDetailDescription(props.detail.location_description),
);
</script>

<template>
  <section class="space-y-3 rounded-lg border border-default bg-default p-4">
    <div class="flex items-center justify-between gap-2">
      <h3 class="text-xs font-semibold uppercase tracking-wider text-muted">
        Ubicación
      </h3>
      <UButton
        color="neutral"
        icon="i-lucide-pencil"
        label="Editar"
        size="xs"
        variant="ghost"
      />
    </div>

    <div class="h-44 overflow-hidden rounded-lg border border-default">
      <ClientOnly>
        <GoogleMap
          v-if="config.public.googleMapsApiKey"
          :map-id="mapId"
          :api-key="config.public.googleMapsApiKey"
          :center="mapCenter"
          :zoom="position ? 15 : 11"
          class="h-full w-full"
          :map-type-control="false"
          :street-view-control="false"
          :fullscreen-control="false"
          gesture-handling="cooperative"
        >
          <AdvancedMarker
            v-if="position"
            :options="{
              position,
              title: detail.client_name,
            }"
            :pin-options="{
              background: '#ef4444',
              borderColor: '#b91c1c',
              glyphColor: '#ffffff',
            }"
          />
        </GoogleMap>
        <div
          v-else
          class="flex h-full items-center justify-center text-xs text-muted"
        >
          Mapa no disponible
        </div>
      </ClientOnly>
    </div>

    <div class="space-y-0.5">
      <p class="text-xs font-medium uppercase text-muted">
        Descripción del lugar
      </p>
      <p class="text-xs text-highlighted line-clamp-2">
        {{ locationDescription }}
      </p>
    </div>
    <p class="text-xs font-mono text-muted">
      {{ coordinatesLabel }}
    </p>
  </section>
</template>
