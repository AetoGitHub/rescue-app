<script setup lang="ts">
import type { RescueServiceType } from '~/interfaces/rescue';
import { RESCUE_SERVICE_TYPE_OPTIONS } from '~/constants/rescue-select-options';

const model = defineModel<RescueServiceType>({ required: true });
</script>

<template>
  <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
    <UButton
      v-for="option in RESCUE_SERVICE_TYPE_OPTIONS"
      :key="option.value"
      type="button"
      size="xl"
      class="flex h-auto min-h-28 flex-col items-center justify-center gap-1.5 px-2 py-4"
      :variant="model === option.value ? 'solid' : 'outline'"
      :color="model === option.value ? 'primary' : 'neutral'"
      @click="model = option.value"
    >
      <UIcon :name="option.icon" class="size-8 shrink-0" />
      <span class="text-center text-sm font-semibold uppercase leading-tight tracking-wide">
        {{ option.label }}
      </span>
      <span
        :class="[
          'text-center text-xs font-normal leading-snug',
          model === option.value ? 'opacity-90' : 'text-muted',
        ]"
      >
        {{ option.description }}
      </span>
    </UButton>
  </div>
</template>
