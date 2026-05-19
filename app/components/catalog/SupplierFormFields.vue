<script setup lang="ts">
import type { SupplierCreateBody } from '~/interfaces/catalogs/supplier';
import { SUPPLIER_SERVICE_TYPE_OPTIONS } from '~/constants/catalog-select-options';

defineProps<{
  state: SupplierCreateBody;
  showMap?: boolean;
}>();
</script>

<template>
  <UFormField label="Nombre" name="name">
    <UInput
      :model-value="state.name"
      class="w-full uppercase"
      @update:model-value="
        (value) => (state.name = formatCatalogNameInput(value))
      "
    />
  </UFormField>
  <UFormField label="Descripción" name="description">
    <UTextarea v-model="state.description" class="w-full" :rows="4" />
  </UFormField>
  <UFormField label="Teléfono" name="phone">
    <UInput
      :model-value="state.phone"
      class="w-full"
      type="tel"
      inputmode="tel"
      autocomplete="tel"
      :placeholder="MEXICO_PHONE_MASK.replaceAll('#', '0')"
      @update:model-value="(value) => (state.phone = formatMexicoPhoneInput(value))"
    />
  </UFormField>
  <UFormField label="Correo" name="email">
    <UInput v-model="state.email" type="email" class="w-full" />
  </UFormField>
  <UFormField label="Tipo de servicio" name="service_type">
    <USelectMenu
      v-model="state.service_type"
      :items="[...SUPPLIER_SERVICE_TYPE_OPTIONS]"
      value-key="value"
      class="w-full"
      variant="subtle"
    />
  </UFormField>
  <UFormField name="is_trusted">
    <UCheckbox v-model="state.is_trusted" label="Proveedor confiable" />
  </UFormField>
  <UFormField label="Notas" name="notes">
    <UTextarea v-model="state.notes" class="w-full" :rows="3" />
  </UFormField>
  <UFormField v-if="showMap !== false" label="Ubicación" name="latitude">
    <SharedMapPinPicker
      v-model:latitude="state.latitude"
      v-model:longitude="state.longitude"
    />
  </UFormField>
</template>
