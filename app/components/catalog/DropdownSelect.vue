<script setup lang="ts">
import type { CatalogDropdownFetcher } from '~/composables/useCatalogDropdown';

const props = defineProps<{
  modelValue?: number | null;
  placeholder?: string;
  fetcher: CatalogDropdownFetcher;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined];
}>();

const { searchTerm, items, loading, errorMessage } = useCatalogDropdown(
  (search, options) => props.fetcher(search, options),
);

const inner = computed({
  get: () => props.modelValue ?? undefined,
  set: (v: number | undefined) => emit('update:modelValue', v),
});

const selectKey = computed(() => String(inner.value ?? 'empty'));

watch(
  () => props.modelValue,
  (value) => {
    if (value == null) {
      searchTerm.value = '';
    }
  },
);
</script>

<template>
  <div class="w-full space-y-1">
    <USelectMenu
      :key="selectKey"
      v-model="inner"
      v-model:search-term="searchTerm"
      ignore-filter
      value-key="id"
      label-key="name"
      :items="items"
      :loading="loading"
      :placeholder="placeholder"
      clear
      class="w-full"
      variant="subtle"
      :ui="{ base: 'bg-default' }"
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
