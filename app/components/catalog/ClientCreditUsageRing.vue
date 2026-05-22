<script setup lang="ts">
const props = defineProps<{
  percent: number | null;
  size?: 'xs' | 'sm' | 'md';
}>();

const sizeClass = computed(() => {
  switch (props.size ?? 'sm') {
    case 'xs':
      return 'size-10 text-[10px]';
    case 'md':
      return 'size-20 text-sm';
    default:
      return 'size-14 text-xs';
  }
});

const ringColor = computed(() => {
  if (props.percent == null) return 'text-muted';
  if (props.percent >= 100) return 'text-error';
  return 'text-primary';
});

const strokeDash = computed(() => {
  if (props.percent == null) return '0 100';
  const p = Math.min(100, Math.max(0, props.percent));
  return `${p} ${100 - p}`;
});
</script>

<template>
  <div
    v-if="percent != null"
    :class="['relative inline-flex shrink-0 items-center justify-center', sizeClass]"
    role="img"
    :aria-label="`${percent}% usado`"
  >
    <svg class="size-full -rotate-90" viewBox="0 0 36 36">
      <circle
        cx="18"
        cy="18"
        r="15.5"
        fill="none"
        class="stroke-muted/30"
        stroke-width="3"
      />
      <circle
        cx="18"
        cy="18"
        r="15.5"
        fill="none"
        :class="['stroke-current', ringColor]"
        stroke-width="3"
        stroke-linecap="round"
        pathLength="100"
        :stroke-dasharray="strokeDash"
      />
    </svg>
    <span
      :class="[
        'absolute inset-0 flex items-center justify-center font-semibold tabular-nums',
        ringColor,
      ]"
    >
      {{ percent }}%
    </span>
  </div>
  <span v-else class="text-muted">—</span>
</template>
