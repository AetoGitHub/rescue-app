<script setup lang="ts">
import type { CatalogDropdownRow } from '~/interfaces/shared/catalog-dropdown.interface';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';

const props = defineProps<{
  modelValue?: number | null;
  placeholder?: string;
  fetcher: (search: string) => Promise<PaginatedResponse<CatalogDropdownRow>>;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined];
}>();

const { searchTerm, items, loading } = useCatalogDropdown((search) =>
  props.fetcher(search),
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
  />
</template>
