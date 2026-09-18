<script setup lang="ts">
import {
  compareCalendarDateParts,
  minCalendarDateParts,
  todayCalendarDateParts,
  type CalendarDateParts,
} from '~/utils/payment-list-query';
import { DASHBOARD_REPORT_RESCUES_EXCEL_PATH } from '~/constants/dashboard-report-api';

const props = defineProps<{
  /** Filtros extra (ej. los del panel Administrativo) que se mandan junto a las fechas. */
  extraQuery?: Record<string, string>;
}>();

const open = defineModel<boolean>('open', { required: true });

const toast = useToast();
const maxSelectableDate = todayCalendarDateParts();

const startDate = ref<CalendarDateParts | null>(null);
const endDate = ref<CalendarDateParts | null>(null);
const isDownloading = ref(false);

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

async function handleDownload() {
  if (startDate.value == null || endDate.value == null || isRangeInvalid.value) return;

  isDownloading.value = true;
  try {
    const response = await $fetch.raw<Blob>(DASHBOARD_REPORT_RESCUES_EXCEL_PATH, {
      responseType: 'blob',
      query: {
        ...props.extraQuery,
        start_date: calendarDateToApiDate(startDate.value),
        end_date: calendarDateToApiDate(endDate.value),
      },
    });
    const filename =
      filenameFromContentDisposition(response.headers.get('content-disposition'))
      || 'reporte_rescates.xlsx';
    downloadBlob(response._data as Blob, filename);
    open.value = false;
  } catch (error) {
    toast.add({
      title: 'No se pudo descargar el Excel',
      description: getFetchErrorMessage(error),
      color: 'error',
    });
  } finally {
    isDownloading.value = false;
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
    title="Reporte de rescates (Excel)"
    description="Selecciona el rango de fechas a exportar"
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
          :disabled="startDate == null || endDate == null || isRangeInvalid || isDownloading"
          @click="handleDownload"
        />
      </div>
    </template>
  </UModal>
</template>
