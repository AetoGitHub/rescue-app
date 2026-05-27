<script setup lang="ts">
import type { RescueServiceType } from '~/interfaces/rescue';
import { SLA_REQUEST_TYPE_META } from '~/constants/sla-config';

const open = defineModel<boolean>('open', { default: false });

const props = defineProps<{
  serviceType: RescueServiceType;
  countLabel: string;
  hasDirty?: boolean;
}>();

const meta = computed(() => SLA_REQUEST_TYPE_META[props.serviceType]);
</script>

<template>
  <UPageCard>
    <UCollapsible v-model:open="open">
      <button
        type="button"
        class="flex w-full items-center gap-3 text-left"
        @click="open = !open"
      >
        <div
          class="flex size-10 shrink-0 items-center justify-center rounded-lg"
          :style="{ backgroundColor: `${meta.accentHex}22` }"
        >
          <UIcon :name="meta.icon" class="size-5" :style="{ color: meta.accentHex }" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="font-semibold">{{ meta.label }}</span>
            <span
              v-if="hasDirty"
              class="size-2 shrink-0 rounded-full bg-warning animate-pulse"
              title="Cambios sin guardar"
            />
          </div>
          <p class="text-sm text-muted">
            {{ countLabel }}
          </p>
        </div>
        <UIcon
          :name="open ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
          class="size-5 shrink-0 text-muted"
        />
      </button>
      <template #content>
        <div class="flex flex-col gap-4 pt-4">
          <slot />
        </div>
      </template>
    </UCollapsible>
  </UPageCard>
</template>
