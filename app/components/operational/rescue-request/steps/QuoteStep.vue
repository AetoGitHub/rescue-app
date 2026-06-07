<script setup lang="ts">
import type { CatalogDropdownFetcher } from '~/composables/useCatalogDropdown';
import type { RescueRequestFormState } from '~/schemas/rescue-create';

const state = defineModel<RescueRequestFormState>({ required: true });

defineProps<{
  fetchServiceDropdown: CatalogDropdownFetcher;
}>();
</script>

<template>
  <OperationalRescueQuoteEditor
    v-model:quote-lines="state.quote_lines"
    v-model:company-settings="state.company_settings"
    :client-id="state.client"
    :client-credit-snapshot="state.client_credit_snapshot"
    :service-type="state.service_type"
    :fetch-service-dropdown="fetchServiceDropdown"
  />
</template>
