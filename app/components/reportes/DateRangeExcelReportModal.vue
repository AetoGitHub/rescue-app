<script setup lang="ts">
import {
  compareCalendarDateParts,
  minCalendarDateParts,
  todayCalendarDateParts,
  type CalendarDateParts,
} from '~/utils/payment-list-query';

const props = defineProps<{
  title: string;
  description?: string;
  /** Endpoint del reporte (GET, acepta start_date/end_date). */
  path: string;
  defaultFilename: string;
}>();

const open = defineModel<boolean>('open', { required: true });

const maxSelectableDate = todayCalendarDateParts();
const { download, isDownloading } = useExcelReportDownload(props.path, props.defaultFilename);

const startDate = ref<CalendarDateParts | null>(null);
const endDate = ref<CalendarDateParts | null>(null);

const startDateMax = computed(() =>
  endDate.value != null
    ? minCalendarDateParts(endDate.value, maxSelectableDate)
    : maxSelectableDate,
);
const endDateMin = computed(() => startDate.value ?? undefined);

const isRangeInvalid = computed(() => {
  if (startDate.value == null || endDate.value == null) return false;
  return compareCalendarDateParts(endDate.value, startDate.value) < 0;
});

const canDownload = computed(
  () => startDate.value != null && endDate.value != null && !isRangeInvalid.value,
);

async function handleDownload() {
  if (!canDownload.value || startDate.value == null || endDate.value == null) return;

  const ok = await download({
    start_date: calendarDateToApiDate(startDate.value),
    end_date: calendarDateToApiDate(endDate.value),
  });
  if (ok) {
    open.value = false;
  }
}

function handleCancel() {
  open.value = false;
}

watch(open, (isOpen) => {
  if (!isOpen) {
    startDate.value = null;
    endDate.value = null;
  }
});
</script>

<template>
  <UModal
    v-model:open="open"
    :dismissible="false"
    :title="title"
    :description="description ?? 'Selecciona el rango de fechas a exportar'"
    :ui="{ content: 'max-w-md' }"
  >
    <template #body>
      <div class="flex flex-wrap items-end gap-3">
        <UFormField label="Desde" class="min-w-44 flex-1">
          <SharedDateInput
            v-model="startDate"
            :max-value="startDateMax"
            :disabled="isDownloading"
          />
        </UFormField>

        <UFormField
          label="Hasta"
          class="min-w-44 flex-1"
          :error="isRangeInvalid ? 'No puede ser anterior a la fecha inicial' : undefined"
        >
          <SharedDateInput
            v-model="endDate"
            :min-value="endDateMin"
            :max-value="maxSelectableDate"
            :disabled="isDownloading"
          />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full items-center justify-end gap-3">
        <UButton
          color="neutral"
          variant="outline"
          label="Cancelar"
          :disabled="isDownloading"
          @click="handleCancel"
        />
        <UButton
          color="primary"
          icon="i-lucide-download"
          label="Descargar Excel"
          :loading="isDownloading"
          :disabled="!canDownload || isDownloading"
          @click="handleDownload"
        />
      </div>
    </template>
  </UModal>
</template>
