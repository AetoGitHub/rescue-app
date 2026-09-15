<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    clientId?: number | null;
    companyId?: number | null;
    placeholder?: string;
    disabled?: boolean;
  }>(),
  {
    clientId: null,
    companyId: null,
    placeholder: 'Vehículo: todos',
    disabled: false,
  },
);

const model = defineModel<string[]>({ default: () => [] });

const { searchTerm, items, loading, errorMessage } = useVehicleFilterOptions({
  clientId: () => props.clientId,
  companyId: () => props.companyId,
});

function onCreate(item: string) {
  searchTerm.value = '';
  if (model.value.includes(item)) return;
  model.value = [...model.value, item];
}
</script>

<template>
  <div class="w-full space-y-1">
    <UInputMenu
      v-model="model"
      v-model:search-term="searchTerm"
      multiple
      create-item
      ignore-filter
      :items="items"
      :loading="loading"
      :placeholder="placeholder"
      :disabled="disabled"
      class="w-full"
      variant="subtle"
      :ui="{ base: 'bg-default' }"
      @create="onCreate"
    />
    <p
      v-if="errorMessage"
      class="text-xs text-error"
      role="alert"
    >
      {{ errorMessage }}
    </p>
  </div>
</template>
