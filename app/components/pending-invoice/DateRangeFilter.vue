<script setup lang="ts">
const { startDate, endDate, clearDates } = usePendingInvoiceList();

const startDateMax = computed(() => endDate.value ?? undefined);
const endDateMin = computed(() => startDate.value ?? undefined);
const hasDates = computed(
  () => startDate.value != null || endDate.value != null,
);

watch(startDate, from => {
  if (from == null || endDate.value == null) return;
  if (compareCalendarDateParts(from, endDate.value) > 0) {
    endDate.value = from;
  }
});

watch(endDate, to => {
  if (to == null || startDate.value == null) return;
  if (compareCalendarDateParts(to, startDate.value) < 0) {
    startDate.value = to;
  }
});
</script>

<template>
  <div class="flex flex-wrap items-end gap-3">
    <div class="flex min-w-44 flex-col gap-0.5">
      <p class="text-[11px] font-medium uppercase tracking-wider text-muted">
        Desde
      </p>
      <SharedDateInput
        v-model="startDate"
        :max-value="startDateMax"
      />
    </div>

    <div class="flex min-w-44 flex-col gap-0.5">
      <p class="text-[11px] font-medium uppercase tracking-wider text-muted">
        Hasta
      </p>
      <SharedDateInput
        v-model="endDate"
        :min-value="endDateMin"
      />
    </div>

    <UButton
      v-if="hasDates"
      color="neutral"
      variant="ghost"
      icon="i-lucide-x"
      aria-label="Quitar filtro de fechas"
      @click="clearDates"
    />
  </div>
</template>
