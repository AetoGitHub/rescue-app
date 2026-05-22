<script setup lang="ts">
const props = defineProps<{
  percent: number | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}>();

const sizeClass = computed(() => {
  switch (props.size ?? 'sm') {
    case 'xs':
      return 'size-10 text-[10px]';
    case 'md':
      return 'size-20 text-sm';
    case 'lg':
      return 'size-[180px] text-2xl';
    default:
      return 'size-14 text-xs';
  }
});

const progressColor = computed(() => {
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
        class="stroke-neutral-200 dark:stroke-neutral-700"
        stroke-width="3"
      />
      <circle
        cx="18"
        cy="18"
        r="15.5"
        fill="none"
        :class="['stroke-current', progressColor]"
        stroke-width="3"
        stroke-linecap="round"
        pathLength="100"
        :stroke-dasharray="strokeDash"
      />
    </svg>
    <div
      :class="[
        'absolute inset-0 flex flex-col items-center justify-center font-semibold tabular-nums leading-tight',
        progressColor,
      ]"
    >
      <span>{{ percent }}%</span>
    </div>
  </div>
  <span v-else class="text-muted">—</span>
</template>
