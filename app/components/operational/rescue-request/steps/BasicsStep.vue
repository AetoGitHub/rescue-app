<script setup lang="ts">
import type { RescueRequestFormState } from '~/schemas/rescue-create';
import type { CatalogDropdownFetcher } from '~/composables/useCatalogDropdown';

const state = defineModel<RescueRequestFormState>({ required: true });

const showClientCreditCard = computed(() => {
  if (state.value.client == null) return false;
  if (state.value.client_credit_snapshot == null) return true;
  return state.value.client_credit_snapshot.client_type === 'CREDIT';
});

const clientCreditPending = computed(
  () =>
    state.value.client != null && state.value.client_credit_snapshot == null,
);

defineProps<{
  fetchClientDropdown: CatalogDropdownFetcher;
  fetchManagerDropdown: CatalogDropdownFetcher;
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

    <OperationalRescueRequestClientCreditSelectionCard
      v-if="showClientCreditCard"
      :client-name="state.clientLabel || `Cliente #${state.client}`"
      :snapshot="state.client_credit_snapshot"
      :pending="clientCreditPending"
    />

    <UFormField name="general_public">
      <UCheckbox
        v-model="state.general_public"
        label="Público en general"
      />
    </UFormField>

    <UFormField label="Número económico" name="serialNumber">
      <UInput v-model="state.serialNumber" class="w-full" />
    </UFormField>

    <UFormField label="Gestor" name="manager" required>
      <CatalogDropdownSelect
        v-model="state.manager"
        placeholder="Buscar gestor"
        :fetcher="fetchManagerDropdown"
      />
    </UFormField>
  </div>
</template>
