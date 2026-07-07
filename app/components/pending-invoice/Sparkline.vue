<script setup lang="ts">
import type { PendingInvoiceSparklinePoint } from '~/interfaces/invoicing/pending-invoice';
import { buildSparklinePolylinePoints } from '~/utils/pending-invoice-display';

const props = withDefaults(
  defineProps<{
    points?: PendingInvoiceSparklinePoint[] | null;
    width?: number;
    height?: number;
    strokeClass?: string;
  }>(),
  {
    points: () => [],
    width: 120,
    height: 32,
    strokeClass: 'stroke-primary',
  },
);

const values = computed(() =>
  (props.points ?? []).map((point) => point.valor),
);

const polylinePoints = computed(() =>
  buildSparklinePolylinePoints(
    values.value,
    props.width,
    props.height,
  ),
);

const hasData = computed(
  () => values.value.length > 0 && polylinePoints.value.length > 0,
);
</script>

<template>
  <svg
    :width="width"
    :height="height"
    :viewBox="`0 0 ${width} ${height}`"
    class="overflow-visible"
    aria-hidden="true"
  >
    <polyline
      v-if="hasData"
      fill="none"
      :class="['stroke-2', strokeClass]"
      :points="polylinePoints"
    />
    <line
      v-else
      :x1="2"
      :y1="height / 2"
      :x2="width - 2"
      :y2="height / 2"
      class="stroke-muted/40 stroke-1"
    />
  </svg>
</template>
