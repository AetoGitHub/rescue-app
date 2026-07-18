<script setup lang="ts">
import { useInfiniteScroll } from '@vueuse/core';
import type {
  CatalogDropdownFetcher,
  CatalogDropdownInfiniteMode,
} from '~/composables/useCatalogDropdown';
import type { CatalogDropdownRow } from '~/interfaces/shared/catalog-dropdown.interface';

const props = defineProps<{
  modelValue?: number | null;
  label?: string | null;
  placeholder?: string;
  fetcher: CatalogDropdownFetcher;
  disabled?: boolean;
  infinite?: CatalogDropdownInfiniteMode;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined];
  'update:label': [value: string];
}>();

const selectMenu = useTemplateRef('selectMenu');

const dropdown = useCatalogDropdown(
  (search, options) => props.fetcher(search, options),
  props.infinite ? { infinite: props.infinite } : undefined,
);

const {
  searchTerm,
  items,
  loading,
  loadingMore,
  errorMessage,
  infinite,
  hasNextPage,
  loadNextPage,
  asyncStatus,
} = dropdown;

const displayItems = computed((): CatalogDropdownRow[] => {
  const list = items.value;
  const id = props.modelValue;
  const name = props.label?.trim() ?? '';
  if (id == null || !name) return list;
  if (list.some((row) => row.id === id)) return list;
  return [{ id, name }, ...list];
});

const inner = computed({
  get: () => props.modelValue ?? undefined,
  set: (v: number | undefined) => {
    emit('update:modelValue', v);
    if (v == null) {
      emit('update:label', '');
      return;
    }
    const row = items.value.find((item) => item.id === v);
    if (row != null) {
      emit('update:label', row.name);
    }
  },
});

const selectKey = computed(() => String(inner.value ?? 'empty'));

watch(
  () => props.modelValue,
  (value) => {
    if (value == null) {
      searchTerm.value = '';
      if ((props.label?.trim() ?? '') !== '') {
        emit('update:label', '');
      }
    }
  },
);

onMounted(() => {
  if (!props.infinite) return;

  useInfiniteScroll(
    () => selectMenu.value?.viewportRef,
    () => {
      void loadNextPage();
    },
    {
      canLoadMore: () =>
        hasNextPage.value && asyncStatus.value !== 'loading',
    },
  );
});
</script>

<template>
  <div class="w-full space-y-1">
    <USelectMenu
      ref="selectMenu"
      :key="selectKey"
      v-model="inner"
      v-model:search-term="searchTerm"
      ignore-filter
      value-key="id"
      label-key="name"
      :items="displayItems"
      :loading="loading"
      :placeholder="placeholder"
      :disabled="disabled"
      clear
      class="w-full"
      variant="subtle"
      :ui="{ base: 'bg-default' }"
    >
      <template v-if="infinite" #content-bottom>
        <div class="flex min-h-8 items-center justify-center px-2 py-1">
          <UIcon
            v-if="loadingMore"
            name="i-lucide-loader-circle"
            class="size-4 animate-spin text-muted"
            aria-hidden="true"
          />
          <span
            v-else-if="hasNextPage"
            class="text-xs text-muted"
          >
            Desplázate para cargar más
          </span>
        </div>
      </template>
    </USelectMenu>
    <p
      v-if="errorMessage"
      class="text-xs text-error"
      role="alert"
    >
      {{ errorMessage }}
    </p>
  </div>
</template>
