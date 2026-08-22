<script setup lang="ts">
import { FILL_OC_MOCK_KEY } from '~/constants/fill-oc-api';

const route = useRoute();

const currentKey = computed(() => {
  const raw = route.query.key;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return typeof value === 'string' ? value.trim() : '';
});

const scenarios = [
  { label: 'Lista', key: FILL_OC_MOCK_KEY.list },
  { label: 'Sin clave', key: '' },
  { label: 'No autorizado', key: FILL_OC_MOCK_KEY.unauthorized },
  { label: 'Vacío', key: FILL_OC_MOCK_KEY.empty },
  { label: 'Error', key: FILL_OC_MOCK_KEY.error },
] as const;

function isActive(key: string): boolean {
  return currentKey.value === key;
}

function openScenario(key: string) {
  return navigateTo({
    path: '/admin/llenar-oc',
    query: key ? { key } : {},
  });
}
</script>

<template>
  <div class="border-b border-warning/30 bg-warning/10 px-4 py-2">
    <div class="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-2">
      <p class="text-[11px] font-semibold uppercase tracking-wider text-warning">
        Preview local
      </p>
      <UButton
        v-for="scenario in scenarios"
        :key="scenario.label"
        size="xs"
        :color="isActive(scenario.key) ? 'warning' : 'neutral'"
        :variant="isActive(scenario.key) ? 'solid' : 'ghost'"
        :label="scenario.label"
        @click="() => void openScenario(scenario.key)"
      />
    </div>
  </div>
</template>
