<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui';
import { watchDebounced } from '@vueuse/core';
import type { z } from 'zod';
import {
  emptyRescueLocationUpdateState,
  rescueLocationUpdateSchema,
  rescueLocationUpdateToBody,
  type RescueLocationUpdateFormState,
} from '~/schemas/rescue-location-update';
import {
  fetchAddressFromCoords,
  readGeocodingLatLng,
} from '~/utils/maps-geocoding';

const open = defineModel<boolean>('open', { required: true });

const props = defineProps<{
  rescueId: number;
  latitude: string | null;
  longitude: string | null;
  locationDescription: string;
}>();

const emit = defineEmits<{
  saved: [];
}>();

const apiFetch = useApiFetch();
const toast = useToast();
const formRef = ref<{ submit: () => Promise<void> } | null>(null);
const state = reactive<RescueLocationUpdateFormState>(
  emptyRescueLocationUpdateState(),
);
const geocodingPending = ref(false);
let geocodingRequestId = 0;
const mapLayoutKey = ref(0);

const {
  guardedOpen,
  discardConfirmOpen,
  requestClose,
  confirmDiscard,
  cancelDiscard,
  closeWithoutConfirm,
  resetDirtySnapshot,
} = useDiscardChangesGuard({
  open,
  snapshot: () => state,
});

const { saveLocation, isUpdating } = useRescueLocationUpdate(() => props.rescueId);

watch(open, (isOpen) => {
  if (!isOpen) return;
  state.location_latitude = props.latitude?.trim() || null;
  state.location_longitude = props.longitude?.trim() || null;
  state.location_description = props.locationDescription?.trim() ?? '';
  mapLayoutKey.value += 1;
  resetDirtySnapshot();
});

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
      state.location_description = address;
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
    readGeocodingLatLng(state.location_latitude, state.location_longitude),
  (coords) => {
    if (!open.value || coords == null) return;
    void resolveLocationDescription(coords);
  },
  { debounce: 400, maxWait: 1200 },
);

async function onSubmit(
  event: FormSubmitEvent<z.infer<typeof rescueLocationUpdateSchema>>,
) {
  const body = rescueLocationUpdateToBody(event.data);
  const ok = await saveLocation(body);
  if (ok) {
    closeWithoutConfirm();
    emit('saved');
  }
}

function onSaveClick() {
  void formRef.value?.submit();
}
</script>

<template>
  <UModal
    v-model:open="guardedOpen"
    :dismissible="false"
    title="Editar ubicación"
    :ui="{ content: 'max-w-2xl' }"
  >
    <template #body>
      <UForm
        ref="formRef"
        :schema="rescueLocationUpdateSchema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField
          label="Ubicación de la unidad"
          name="location_latitude"
          required
        >
          <SharedLocationPicker
            :map-layout-key="mapLayoutKey"
            v-model:latitude="state.location_latitude"
            v-model:longitude="state.location_longitude"
            latitude-name="location_latitude"
            longitude-name="location_longitude"
            empty-status-label="Indica la ubicación de la unidad"
          />
        </UFormField>

        <UFormField
          label="Descripción del lugar"
          name="location_description"
          required
        >
          <div class="space-y-2">
            <UInput v-model="state.location_description" class="w-full" />
            <p
              v-if="geocodingPending"
              class="flex items-center gap-2 text-xs text-muted"
            >
              <UIcon
                name="i-lucide-loader-circle"
                class="size-3.5 animate-spin"
              />
              Obteniendo dirección…
            </p>
          </div>
        </UFormField>
      </UForm>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          color="neutral"
          label="Cancelar"
          variant="subtle"
          :disabled="isUpdating"
          @click="requestClose"
        />
        <UButton
          color="primary"
          label="Guardar"
          :loading="isUpdating"
          :disabled="isUpdating"
          @click="onSaveClick"
        />
      </div>
    </template>
  </UModal>

  <SharedDiscardChangesConfirmModal
    v-model:open="discardConfirmOpen"
    @confirm="confirmDiscard"
    @cancel="cancelDiscard"
  />
</template>
