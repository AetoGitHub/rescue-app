<script setup lang="ts">
import {
  PENDING_INVOICE_ATTENTION_OPTIONS,
  PENDING_INVOICE_MONTH_OPTIONS,
  PENDING_INVOICE_STATUS_OPTIONS,
  PENDING_INVOICE_YEAR_OPTIONS,
} from '~/constants/pending-invoice-api';
import type { PendingInvoiceDetailFilters } from '~/interfaces/invoicing/pending-invoice-filters';

const filters = defineModel<PendingInvoiceDetailFilters>('filters', {
  required: true,
});

const {
  fetchAdministrativeCompanyDropdown,
  fetchAdministrativeManagerDropdown,
  fetchAdministrativeSellerDropdown,
} = useAdministrativeBoardDropdownFetchers();
</script>

<template>
  <div class="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-8">
    <UInput
      v-model="filters.search"
      class="w-full sm:col-span-2 2xl:col-span-2"
      icon="i-lucide-search"
      placeholder="Buscar folio, compañía, unidad, autorizador…"
    />

    <CatalogDropdownSelect
      v-model="filters.company"
      class="w-full"
      placeholder="Todas las compañías"
      :fetcher="fetchAdministrativeCompanyDropdown"
    />

    <CatalogDropdownSelect
      v-model="filters.seller"
      class="w-full"
      placeholder="Todos los responsables"
      :fetcher="fetchAdministrativeSellerDropdown"
    />

    <CatalogDropdownSelect
      v-model="filters.operator"
      class="w-full"
      placeholder="Todos los operadores"
      :fetcher="fetchAdministrativeManagerDropdown"
    />

    <USelect
      v-model="filters.month"
      :items="PENDING_INVOICE_MONTH_OPTIONS"
      value-key="value"
      label-key="label"
      class="w-full"
      variant="subtle"
      :ui="{ base: 'bg-default' }"
    />

    <USelect
      v-model="filters.year"
      :items="PENDING_INVOICE_YEAR_OPTIONS"
      value-key="value"
      label-key="label"
      class="w-full"
      variant="subtle"
      :ui="{ base: 'bg-default' }"
    />

    <USelect
      v-model="filters.status"
      :items="PENDING_INVOICE_STATUS_OPTIONS"
      value-key="value"
      label-key="label"
      class="w-full"
      variant="subtle"
      :ui="{ base: 'bg-default' }"
    />

    <USelect
      v-model="filters.attention"
      :items="PENDING_INVOICE_ATTENTION_OPTIONS"
      value-key="value"
      label-key="label"
      class="w-full"
      variant="subtle"
      :ui="{ base: 'bg-default' }"
    />
  </div>
</template>
