<script setup lang="ts">
const props = defineProps<{
  score: number | null | undefined;
  size?: 'xs' | 'sm';
}>();

const normalizedScore = computed(() => {
  const value = props.score;
  if (value == null || !Number.isFinite(value) || value <= 0) return null;
  return Math.min(5, Math.max(0, value));
});

const displayValue = computed(() => {
  if (normalizedScore.value == null) return '—';
  return normalizedScore.value.toFixed(1);
});

const toneClass = computed(() => {
  const value = normalizedScore.value;
  if (value == null) return 'text-muted';
  if (value >= 4) return 'text-success';
  if (value >= 3) return 'text-warning';
  return 'text-error';
});

const starCount = 5;

const filledStars = computed(() => {
  if (normalizedScore.value == null) return 0;
  return Math.round(normalizedScore.value);
});

const iconSize = computed(() => (props.size === 'xs' ? 'size-3' : 'size-3.5'));
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 tabular-nums"
    :class="toneClass"
  >
    <span class="inline-flex items-center gap-0.5" aria-hidden="true">
      <UIcon
        v-for="index in starCount"
        :key="index"
        :name="index <= filledStars ? 'i-heroicons-star-solid' : 'i-heroicons-star'"
        :class="[iconSize, index > filledStars ? 'opacity-40' : '']"
      />
    </span>
    <span class="text-xs font-medium">{{ displayValue }}</span>
  </span>
</template>
