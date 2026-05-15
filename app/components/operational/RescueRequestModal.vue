<script setup lang="ts">
import { useMutation } from '@pinia/colada';
import type { FormSubmitEvent } from '@nuxt/ui';
import type { Client } from '~/interfaces/catalogs/client';
import type { RescueCreateResponse } from '~/interfaces/rescue';
import type { CatalogDropdownRow } from '~/interfaces/shared/catalog-dropdown.interface';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';
import { RESCUE_SERVICE_TYPE_OPTIONS } from '~/constants/rescue-select-options';
import {
  rescueCreateFormSchema,
  rescueFormToCreateBody,
  type RescueCreateFormOutput,
} from '~/schemas/rescue-create';

const toast = useToast();

const open = ref(false);

const requestInitialLocation = computed(() => open.value);

function emptyState() {
  return {
    service_type: 'rescue' as const,
    client: undefined as number | undefined,
    general_public: false,
    location_latitude: null as string | null,
    location_longitude: null as string | null,
    location_description: '',
    internal_notes: '',
  };
}

const state = reactive(emptyState());

function resetForm() {
  Object.assign(state, emptyState());
}

function openCreate() {
  resetForm();
  open.value = true;
}

defineExpose({ openCreate });

watch(open, (v) => {
  if (!v) {
    resetForm();
  }
});

async function fetchClientDropdown(
  name: string,
  options?: { signal?: AbortSignal },
) {
  const signal = options?.signal;
  try {
    return await $fetch<PaginatedResponse<CatalogDropdownRow>>(
      '/api/catalogue/client/dropdown/',
      { query: { name }, signal },
    );
  } catch {
    const res = await $fetch<PaginatedResponse<Client>>(
      '/api/catalogue/client/list/',
      { query: { name }, signal },
    );
    return {
      next: res.next,
      previous: res.previous,
      results: res.results.map((c) => ({ id: c.id, name: c.name })),
    };
  }
}

const { mutate, asyncStatus } = useMutation({
  mutation: async (body: ReturnType<typeof rescueFormToCreateBody>) => {
    const data = await $fetch<RescueCreateResponse>('/api/rescue/', {
      method: 'POST',
      body,
    });
    toast.add({
      title: 'Solicitud creada',
      description: `Folio: ${data.folio}`,
      color: 'success',
    });
    open.value = false;
    resetForm();
    return data;
  },
  onError: (e) => {
    console.error(e);
    toast.add({
      title: 'No se pudo crear la solicitud',
      description: getFetchErrorMessage(e),
      color: 'error',
    });
  },
});

const formRef = ref<{ submit: () => Promise<void> } | null>(null);

function onSubmit(payload: FormSubmitEvent<RescueCreateFormOutput>) {
  mutate(rescueFormToCreateBody(payload.data));
}

function onFormError() {
  console.error('Validación de formulario de solicitud de rescate');
}

function cancel() {
  open.value = false;
}

async function requestSubmit() {
  await formRef.value?.submit();
}
</script>

<template>
  <UModal
    v-model:open="open"
    scrollable
    title="Nueva solicitud"
    :ui="{ content: 'max-w-2xl' }"
  >
    <template #body>
      <UForm
        ref="formRef"
        :schema="rescueCreateFormSchema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
        @error="onFormError"
      >
        <UFormField label="Tipo de servicio" name="service_type">
          <USelectMenu
            v-model="state.service_type"
            :items="[...RESCUE_SERVICE_TYPE_OPTIONS]"
            value-key="value"
            class="w-full"
            variant="subtle"
          />
        </UFormField>

        <UFormField label="Cliente" name="client">
          <CatalogDropdownSelect
            v-model="state.client"
            placeholder="Buscar cliente"
            :fetcher="fetchClientDropdown"
          />
        </UFormField>

        <UFormField name="general_public">
          <UCheckbox
            v-model="state.general_public"
            label="Público en general"
          />
        </UFormField>

        <UFormField label="Ubicación en mapa" name="location_latitude">
          <SharedMapPinPicker
            v-model:latitude="state.location_latitude"
            v-model:longitude="state.location_longitude"
            :request-initial-location="requestInitialLocation"
          />
        </UFormField>

        <UFormField label="Descripción de ubicación" name="location_description">
          <UInput v-model="state.location_description" class="w-full" />
        </UFormField>

        <UFormField label="Notas internas" name="internal_notes">
          <UTextarea v-model="state.internal_notes" class="w-full" :rows="3" />
        </UFormField>
      </UForm>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          type="button"
          color="neutral"
          variant="subtle"
          label="Cancelar"
          @click="cancel"
        />
        <UButton
          type="button"
          label="Crear solicitud"
          :loading="asyncStatus === 'loading'"
          :disabled="asyncStatus === 'loading'"
          @click="requestSubmit"
        />
      </div>
    </template>
  </UModal>
</template>
