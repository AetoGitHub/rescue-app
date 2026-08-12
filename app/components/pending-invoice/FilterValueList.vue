<script setup lang="ts">
import type { PendingInvoiceCell } from '~/utils/pending-invoice-aggregate';

const props = withDefaults(
  defineProps<{
    options: PendingInvoiceCell[];
    selected: string[];
    searchPlaceholder?: string;
  }>(),
  {
    searchPlaceholder: 'Buscar valor…',
  },
);

const emit = defineEmits<{
  'update:selected': [values: string[]];
}>();

const search = ref('');

const visibleOptions = computed(() => {
  const needle = search.value.trim().toLowerCase();
  if (!needle) return props.options;
  return props.options.filter(option =>
    option.label.toLowerCase().includes(needle),
  );
});

const allVisibleSelected = computed(
  () =>
    visibleOptions.value.length > 0 &&
    visibleOptions.value.every(option => props.selected.includes(option.value)),
);

function toggle(value: string, checked: boolean) {
  const next = new Set(props.selected);
  if (checked) next.add(value);
  else next.delete(value);
  emit('update:selected', [...next]);
}

function selectAllVisible() {
  const next = new Set(props.selected);
  for (const option of visibleOptions.value) next.add(option.value);
  emit('update:selected', [...next]);
}

function clear() {
  emit('update:selected', []);
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <UInput
      v-model="search"
      icon="i-lucide-search"
      size="sm"
      variant="subtle"
      autofocus
      :placeholder="searchPlaceholder"
    />

    <div class="flex items-center justify-between gap-2 text-xs">
      <UButton
        color="neutral"
        variant="link"
        size="xs"
        class="px-0"
        :disabled="allVisibleSelected || visibleOptions.length === 0"
        label="Seleccionar todo"
        @click="selectAllVisible"
      />
      <UButton
        color="neutral"
        variant="link"
        size="xs"
        class="px-0"
        :disabled="selected.length === 0"
        label="Limpiar"
        @click="clear"
      />
    </div>

    <div class="-mx-1 max-h-56 overflow-y-auto px-1">
      <p
        v-if="visibleOptions.length === 0"
        class="py-4 text-center text-xs text-muted"
      >
        Sin coincidencias
      </p>
      <div
        v-for="option in visibleOptions"
        :key="option.value"
        class="py-1"
      >
        <UCheckbox
          :model-value="selected.includes(option.value)"
          :label="option.label"
          size="sm"
          :ui="{ label: 'truncate' }"
          @update:model-value="(checked) => toggle(option.value, checked === true)"
        />
      </div>
    </div>

    <p class="text-[11px] text-dimmed">
      {{
        selected.length === 0
          ? 'Sin filtro: se muestran todos los valores'
          : `${selected.length} de ${options.length} seleccionados`
      }}
    </p>
  </div>
</template>
