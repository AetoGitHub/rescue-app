<script setup lang="ts">
import type { PendingInvoiceSparklinePoint } from '~/interfaces/invoicing/pending-invoice';

defineProps<{
  label: string;
  value: string;
  points?: PendingInvoiceSparklinePoint[] | null;
}>();
</script>

<template>
  <UPageCard class="flex flex-col gap-3">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="text-xs font-semibold uppercase tracking-wider text-muted">
          {{ label }}
        </p>
        <p class="mt-1 text-2xl font-bold tabular-nums tracking-tight sm:text-3xl">
          {{ value }}
        </p>
        <p class="mt-1 text-xs text-muted">
          últimos 14 días
        </p>
      </div>
      <PendingInvoiceSparkline :points="points" />
    </div>
  </UPageCard>
</template>
