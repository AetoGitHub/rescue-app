<script setup lang="ts">
import type { SupplierCreateBody, SupplierServiceType } from '~/interfaces/catalogs/supplier';
import { SUPPLIER_SERVICE_TYPE_OPTIONS } from '~/constants/catalog-select-options';
import {
  formatCoordinateString,
  parseGoogleMapsUrl,
} from '~/utils/google-maps-link';

const state = defineModel<SupplierCreateBody>('state', { required: true });

const props = defineProps<{
  /** Bumped when the parent dialog opens so Google Maps can remount with correct size. */
  mapLayoutKey?: number;
}>();

const toast = useToast();
const locationTab = ref('map');
const mapsLink = ref('');
const mapRemountKey = ref(0);

const locationTabItems = [
  {
    label: 'Marcar en mapa',
    icon: 'i-lucide-map-pin',
    slot: 'map' as const,
    value: 'map',
  },
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
  },
);

watch(locationTab, (tab) => {
  if (tab === 'map') {
    nextTick(() => {
      mapRemountKey.value += 1;
    });
  }
});

const mapPinPickerRef = ref<{ recenterFromModel: () => void } | null>(null);

const hasCoordinates = computed(() => {
  const lat = state.value.latitude.trim();
  const lng = state.value.longitude.trim();
  return lat !== '' && lng !== '';
});

const locationStatusLabel = computed(() => {
  if (!hasCoordinates.value) {
    return 'Sin ubicación definida (opcional — puedes agregar la ubicación después)';
  }
  return `Ubicación: ${state.value.latitude}, ${state.value.longitude}`;
});

function selectServiceType(value: SupplierServiceType) {
  state.value.service_type = value;
}

function applyParsedCoordinates(lat: number, lng: number) {
  state.value.latitude = formatCoordinateString(lat);
  state.value.longitude = formatCoordinateString(lng);
  nextTick(() => mapPinPickerRef.value?.recenterFromModel());
}

function applyMapsLink() {
  const parsed = parseGoogleMapsUrl(mapsLink.value);
  if (parsed == null) {
    toast.add({
      title: 'No se pudo leer el enlace',
      description:
        'Pega un enlace de Google Maps con coordenadas (@lat,lng o formato compartido).',
      color: 'warning',
    });
    return;
  }
  applyParsedCoordinates(parsed.lat, parsed.lng);
  toast.add({ title: 'Coordenadas aplicadas', color: 'success' });
}

function clearCoordinates() {
  state.value.latitude = '';
  state.value.longitude = '';
  mapsLink.value = '';
}
</script>

<template>
  <div class="space-y-8">
    <section class="space-y-4">
      <h3 class="text-xs font-semibold uppercase tracking-wider text-primary">
        Datos generales
      </h3>

      <UFormField label="Nombre del proveedor" name="name" required>
        <UInput
          :model-value="state.name"
          class="w-full uppercase"
          placeholder="Ej. Grúas Monterrey"
          @update:model-value="
            (value) => (state.name = formatCatalogNameInput(value))
          "
        />
      </UFormField>

      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="Teléfono" name="phone" required>
          <UInput
            :model-value="state.phone"
            class="w-full"
            type="tel"
            inputmode="tel"
            autocomplete="tel"
            :placeholder="MEXICO_PHONE_MASK.replaceAll('#', '0')"
            @update:model-value="
              (value) => (state.phone = formatMexicoPhoneInput(value))
            "
          />
        </UFormField>
        <UFormField label="Email" name="email" required>
          <UInput
            v-model="state.email"
            type="email"
            class="w-full"
            placeholder="contacto@proveedor.com"
          />
        </UFormField>
      </div>

      <UFormField label="Tipo de servicio" name="service_type" required>
        <div class="flex flex-wrap gap-2">
          <UButton
            v-for="option in SUPPLIER_SERVICE_TYPE_OPTIONS"
            :key="option.value"
            type="button"
            size="sm"
            :color="state.service_type === option.value ? 'primary' : 'neutral'"
            :variant="state.service_type === option.value ? 'solid' : 'subtle'"
            :label="option.label"
            @click="selectServiceType(option.value)"
          />
        </div>
        <p
          v-if="state.service_type === 'other'"
          class="mt-2 text-xs text-muted"
        >
          Indica el tipo en notas si no aparece en la lista.
        </p>
      </UFormField>

      <UFormField label="Notas" name="notes">
        <UTextarea
          v-model="state.notes"
          class="w-full"
          :rows="3"
          placeholder="Información adicional del proveedor"
        />
      </UFormField>
    </section>

    <section class="space-y-4">
      <div>
        <h3 class="text-xs font-semibold uppercase tracking-wider text-primary">
          Ubicación base
        </h3>
        <p class="mt-1 text-sm text-muted">
          Ubicación principal del proveedor (taller, base de operaciones).
        </p>
      </div>

      <UTabs
        v-model="locationTab"
        :items="locationTabItems"
        :unmount-on-hide="false"
        class="w-full"
      >
        <template #map>
          <div class="min-h-72 pt-2">
            <p class="mb-2 text-sm text-muted">
              Haz clic en el mapa para colocar el pin. Puedes arrastrarlo para
              ajustar.
            </p>
            <SharedMapPinPicker
              ref="mapPinPickerRef"
              :key="`supplier-map-${mapRemountKey}`"
              v-model:latitude="state.latitude"
              v-model:longitude="state.longitude"
            />
          </div>
        </template>

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
              @click="applyMapsLink"
            />
          </div>
        </template>

        <template #coords>
          <div class="grid gap-4 pt-2 sm:grid-cols-2">
            <UFormField label="Latitud" name="latitude">
              <UInput
                v-model="state.latitude"
                class="w-full"
                placeholder="19.432608"
              />
            </UFormField>
            <UFormField label="Longitud" name="longitude">
              <UInput
                v-model="state.longitude"
                class="w-full"
                placeholder="-99.133209"
              />
            </UFormField>
          </div>
        </template>
      </UTabs>

      <UFormField label="Descripción del lugar" name="description">
        <UTextarea
          v-model="state.description"
          class="w-full"
          :rows="2"
          placeholder="Ej: Estacionamiento Plaza Central, acceso por calle posterior"
        />
      </UFormField>

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
    </section>

    <section class="space-y-4">
      <h3 class="text-xs font-semibold uppercase tracking-wider text-primary">
        Configuración
      </h3>

      <div class="space-y-3 rounded-lg border border-default p-4">
        <UFormField name="is_trusted">
          <div class="flex items-start gap-3">
            <UCheckbox v-model="state.is_trusted" />
            <div>
              <p class="flex items-center gap-1.5 text-sm font-medium">
                <UIcon name="i-lucide-star" class="size-4 text-warning" />
                Proveedor de confianza
              </p>
              <p class="text-xs text-muted">
                Aparece priorizado al asignar servicios.
              </p>
            </div>
          </div>
        </UFormField>
      </div>
    </section>
  </div>
</template>
