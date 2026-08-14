<script setup lang="ts">
type StateTone = 'neutral' | 'warning' | 'error' | 'success';

const props = withDefaults(
  defineProps<{
    icon: string;
    title: string;
    description?: string;
    tone?: StateTone;
  }>(),
  {
    description: undefined,
    tone: 'neutral',
  },
);

const TONE_CLASSES: Record<StateTone, { ring: string; icon: string }> = {
  neutral: { ring: 'bg-elevated', icon: 'text-dimmed' },
  warning: { ring: 'bg-warning/10', icon: 'text-warning' },
  error: { ring: 'bg-error/10', icon: 'text-error' },
  success: { ring: 'bg-success/10', icon: 'text-success' },
};

const tone = computed(() => TONE_CLASSES[props.tone]);
</script>

<template>
  <div class="flex flex-col items-center gap-4 px-6 py-12 text-center">
    <div
      class="flex size-14 items-center justify-center rounded-full"
      :class="tone.ring"
    >
      <UIcon
        :name="icon"
        class="size-7"
        :class="tone.icon"
      />
    </div>

    <div class="space-y-1">
      <p class="text-base font-semibold text-highlighted text-balance">
        {{ title }}
      </p>
      <p
        v-if="description"
        class="text-sm text-muted text-pretty"
      >
        {{ description }}
      </p>
    </div>

    <slot name="action" />
  </div>
</template>
