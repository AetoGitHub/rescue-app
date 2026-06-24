<script setup lang="ts">
import type { RescueDropdownQuery } from '~/composables/useRescueDropdown';

const props = withDefaults(
  defineProps<{
    modelValue: number[];
    excludeRescueId?: number | null;
    clientId?: number | null;
    disabled?: boolean;
    placeholder?: string;
  }>(),
  {
    excludeRescueId: null,
    clientId: null,
    disabled: false,
    placeholder: 'Buscar por folio',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: number[]];
}>();

const baseQuery = computed((): RescueDropdownQuery => ({
  client: props.clientId,
}));

const {
  search,
  items,
  loading,
  errorMessage,
  hasNextPage,
  loadNextPage,
} = useRescueDropdown({
  baseQuery,
  excludeRescueId: () => props.excludeRescueId,
});

const selected = computed({
  get: () => props.modelValue,
  set: (value: number[]) => emit('update:modelValue', value),
});

const selectKey = computed(() => selected.value.join(',') || 'empty');

function onOpenChange(open: boolean) {
  if (open && hasNextPage.value) {
    void loadNextPage();
  }
}
</script>

<template>
  <div class="w-full space-y-1">
    <USelectMenu
      :key="selectKey"
      v-model="selected"
      v-model:search-term="search"
      ignore-filter
      multiple
      value-key="id"
      label-key="label"
      :items="items"
      :loading="loading"
      :placeholder="placeholder"
      :disabled="disabled"
      class="w-full"
      variant="subtle"
      :ui="{ base: 'bg-default' }"
      @update:open="onOpenChange"
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
