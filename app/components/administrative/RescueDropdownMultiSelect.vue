<script setup lang="ts">
import type { RescueDropdownQuery } from '~/composables/useRescueDropdown';

type RescueSelectItem = {
  id: number;
  label: string;
  folio?: string;
  client_name?: string;
};

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

const selectedRowsById = ref<Map<number, RescueSelectItem>>(new Map());

const selected = computed({
  get: () => props.modelValue,
  set: (value: number[]) => {
    const nextMap = new Map<number, RescueSelectItem>();
    for (const id of value) {
      const fromItems = items.value.find((row) => row.id === id);
      const cached = selectedRowsById.value.get(id);
      if (fromItems != null) {
        nextMap.set(id, fromItems);
      } else if (cached != null) {
        nextMap.set(id, cached);
      } else {
        nextMap.set(id, { id, label: `Rescate #${id}` });
      }
    }
    selectedRowsById.value = nextMap;
    emit('update:modelValue', value);
  },
});

watch(
  items,
  (list) => {
    if (props.modelValue.length === 0) return;
    const next = new Map(selectedRowsById.value);
    let changed = false;
    for (const id of props.modelValue) {
      const row = list.find((item) => item.id === id);
      if (row != null) {
        next.set(id, row);
        changed = true;
      }
    }
    if (changed) selectedRowsById.value = next;
  },
  { deep: true },
);

const displayItems = computed((): RescueSelectItem[] => {
  const list = items.value;
  const byId = new Map(list.map((row) => [row.id, row]));
  for (const id of props.modelValue) {
    if (byId.has(id)) continue;
    const cached = selectedRowsById.value.get(id);
    if (cached != null) {
      byId.set(id, cached);
    } else {
      byId.set(id, { id, label: `Rescate #${id}` });
    }
  }
  const selectedFirst = props.modelValue
    .map((id) => byId.get(id))
    .filter((row): row is RescueSelectItem => row != null);
  const rest = list.filter((row) => !props.modelValue.includes(row.id));
  return [...selectedFirst, ...rest];
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
      :items="displayItems"
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
