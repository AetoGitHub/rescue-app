<script setup lang="ts">
defineProps<{
  slideoverTitle?: string;
}>();

const filtersOpen = ref(false);
</script>

<template>
  <div class="flex w-full flex-col gap-3 xl:hidden">
    <slot name="primary" />

    <div class="flex flex-wrap items-center gap-2">
      <USlideover
        v-model:open="filtersOpen"
        :title="slideoverTitle ?? 'Filtros'"
      >
        <UButton
          color="neutral"
          icon="i-lucide-sliders-horizontal"
          label="Filtros"
          variant="subtle"
        />

        <template #body>
          <div class="flex flex-col gap-3">
            <slot name="filters" />
          </div>
        </template>
      </USlideover>

      <slot name="actions" />
    </div>
  </div>

  <div class="hidden w-full xl:block">
    <slot />
  </div>
</template>
