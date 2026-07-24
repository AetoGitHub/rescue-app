<script setup lang="ts">
import type { RescueRequestFormState } from '~/schemas/rescue-create';
import type { CatalogDropdownFetcher } from '~/composables/useCatalogDropdown';

const state = defineModel<RescueRequestFormState>({ required: true });

defineProps<{
  fetchClientDropdown: CatalogDropdownFetcher;
  fetchManagerDropdown: CatalogDropdownFetcher;
  managerLocked?: boolean;
}>();
</script>

<template>
  <div class="space-y-4">
    <UFormField label="Tipo de solicitud" name="service_type" required>
      <OperationalRescueRequestServiceTypePicker v-model="state.service_type" />
    </UFormField>

    <UFormField label="Cliente" name="client" required>
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

    <UFormField label="Número económico" name="serialNumber">
      <UInput v-model="state.serialNumber" class="w-full" />
    </UFormField>

    <UFormField
      v-if="!managerLocked"
      label="Gestor"
      name="manager"
      required
    >
      <CatalogDropdownSelect
        v-model="state.manager"
        placeholder="Buscar gestor"
        :fetcher="fetchManagerDropdown"
      />
    </UFormField>

    <UFormField label="Descripción del servicio" name="service_description">
      <UTextarea
        v-model="state.service_description"
        class="w-full"
        :rows="4"
      />
    </UFormField>
  </div>
</template>
