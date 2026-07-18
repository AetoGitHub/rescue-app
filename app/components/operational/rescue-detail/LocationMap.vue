<script setup lang="ts">
import { AdvancedMarker, GoogleMap } from 'vue3-google-map';
import type { RescueCardDetail } from '~/interfaces/rescue';

const props = withDefaults(
  defineProps<{
    detail: RescueCardDetail;
    editable?: boolean;
  }>(),
  {
    editable: true,
  },
);

const emit = defineEmits<{
  edit: [];
}>();

const config = useRuntimeConfig();
const mapId = '21013da77446513d35236d00';

const position = computed(() =>
  parseRescueCoordinates(props.detail.latitude, props.detail.longitude),
);

const hasMapPosition = computed(() => position.value != null);

const coordinatesLabel = computed(() => {
  if (!position.value) return '—';
  return `${position.value.lat.toFixed(5)}, ${position.value.lng.toFixed(5)}`;
});

const locationDescription = computed(() =>
  formatDetailDescription(props.detail.location_description),
);

const locationActionLabel = computed(() =>
  hasMapPosition.value ? 'Editar' : 'Agregar',
);

const locationActionIcon = computed(() =>
  hasMapPosition.value ? 'i-lucide-pencil' : 'i-lucide-map-pin-plus',
);
</script>

<template>
  <section class="space-y-3 rounded-lg border border-default bg-default p-4">
    <div class="flex items-center justify-between gap-2">
      <h3 class="text-xs font-semibold uppercase tracking-wider text-muted">
        Ubicación
      </h3>
      <UButton
        v-if="editable"
        color="neutral"
        :icon="locationActionIcon"
        :label="locationActionLabel"
        size="xs"
        variant="ghost"
        @click="emit('edit')"
      />
    </div>

    <div
      v-if="hasMapPosition"
      class="h-44 overflow-hidden rounded-lg border border-default"
    >
      <ClientOnly>
        <GoogleMap
          v-if="config.public.googleMapsApiKey && position"
          :map-id="mapId"
          :api-key="config.public.googleMapsApiKey"
          :center="position"
          :zoom="13"
          class="h-full w-full"
          :map-type-control="false"
          :street-view-control="false"
          :fullscreen-control="false"
          gesture-handling="cooperative"
        >
          <AdvancedMarker
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
    <div
      v-else
      class="flex flex-col items-center gap-3 rounded-lg border border-dashed border-default px-3 py-6 text-center"
    >
      <p class="text-xs text-muted">
        Sin ubicación registrada
      </p>
      <UButton
        v-if="editable"
        color="primary"
        variant="soft"
        size="sm"
        icon="i-lucide-map-pin-plus"
        label="Agregar ubicación"
        @click="emit('edit')"
      />
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
