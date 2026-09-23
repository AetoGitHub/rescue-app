<script setup lang="ts">
import {
  compareCalendarDateParts,
  minCalendarDateParts,
  todayCalendarDateParts,
  type CalendarDateParts,
} from '~/utils/payment-list-query';
import {
  ADMINISTRATIVE_API_SERVICE_TYPES,
  ADMINISTRATIVE_ELIGIBLE_OPERATIVE_STATUSES,
  ADMINISTRATIVE_KANBAN_VISIBLE_COLUMNS,
} from '~/constants/administrative-kanban';
import { RESCUE_SERVICE_TYPE_OPTIONS } from '~/constants/rescue-select-options';
import {
  emptyCatalogDropdownSelection,
  type CatalogDropdownSelection,
} from '~/interfaces/shared/catalog-dropdown.interface';
import type { RescueServiceType } from '~/interfaces/rescue';
import { buildAdministrativeListQuery } from '~/utils/administrative-board-filters';
import type { ReportStatusFilterType } from '~/composables/useReportLaunch';

const props = defineProps<{
  /** Filtros extra (ej. los del panel Administrativo) que se mandan junto a las fechas. */
  extraQuery?: Record<string, string>;
  /**
   * Muestra dentro del modal los mismos filtros del panel Administrativo que
   * el reporte Excel ya soporta en el backend (folio, tipo, compañía,
   * cliente, vehículo), además del filtro por status (obligatorio), para
   * armar el query sin depender de un board externo ya filtrado. Se usa en
   * /admin/reportes.
   */
  showFilters?: boolean;
  /**
   * Valores iniciales opcionales, para llegar con el modal ya precargado
   * (ej. desde `useReportLauncher` al lanzarlo desde otra pantalla). Solo se
   * aplican una vez, al crear el componente.
   */
  initialCompany?: CatalogDropdownSelection;
  initialClient?: CatalogDropdownSelection;
  initialStatusType?: ReportStatusFilterType;
  /** 'all' precarga todos los valores disponibles para `initialStatusType`. */
  initialStatusValues?: string[] | 'all';
}>();

const open = defineModel<boolean>('open', { required: true });

const maxSelectableDate = todayCalendarDateParts();
const { downloadRescuesExcelReport, isDownloading } = useRescuesExcelReportDownload();

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

// Filtro por status — obligatorio cuando `showFilters` está activo. Se elige
// un solo tipo (Administrativo u Operativo, nunca ambos) y uno o más valores
// de ese tipo, limitados a los status visibles en las cards administrativas.
// El reporte Excel aun no lo soporta en el backend (pendiente que se agregue
// ahi el manejo de admin_status/operative_status); se manda de todos modos
// con esos mismos nombres de campo del modelo Rescue, como una lista
// separada por comas sin espacios ("valor1,valor2"), para que quede listo en
// cuanto el backend lo implemente.
const adminStatusOptions = ADMINISTRATIVE_KANBAN_VISIBLE_COLUMNS.map((column) => ({
  label: column.title,
  value: column.status as string,
}));

const operativeStatusOptions = ADMINISTRATIVE_ELIGIBLE_OPERATIVE_STATUSES.map((status) => ({
  label: getAdministrativeOperativeStatusLabel(status),
  value: status as string,
}));

function statusOptionsForType(type: ReportStatusFilterType) {
  return type === 'admin' ? adminStatusOptions : operativeStatusOptions;
}

function initialStatusFilterValues(): string[] {
  if (props.initialStatusType == null) return [];
  if (props.initialStatusValues === 'all') {
    return statusOptionsForType(props.initialStatusType).map((option) => option.value);
  }
  return props.initialStatusValues ?? [];
}

const statusFilterType = ref<ReportStatusFilterType | null>(props.initialStatusType ?? null);
const statusFilterValues = ref<string[]>(initialStatusFilterValues());

const statusValueOptions = computed(() =>
  statusFilterType.value != null ? statusOptionsForType(statusFilterType.value) : [],
);

watch(statusFilterType, () => {
  statusFilterValues.value = [];
});

// Mensajes dinamicos de que falta para poder descargar -- se recalculan en
// cada cambio, para que el usuario vea de inmediato por que el boton sigue
// deshabilitado en vez de solo encontrarlo inactivo sin explicacion.
const missingFieldsMessages = computed(() => {
  const messages: string[] = [];

  if (props.showFilters && statusFilterType.value == null) {
    messages.push('Selecciona el tipo de status (Administrativo u Operativo)');
  } else if (props.showFilters && statusFilterValues.value.length === 0) {
    messages.push('Selecciona al menos un status');
  }

  if (startDate.value == null) {
    messages.push('Selecciona la fecha "Desde"');
  }

  if (endDate.value == null) {
    messages.push('Selecciona la fecha "Hasta"');
  }

  if (isRangeInvalid.value) {
    messages.push('"Hasta" no puede ser anterior a "Desde"');
  }

  return messages;
});

const canDownload = computed(() => missingFieldsMessages.value.length === 0);

// Filtros opcionales del modal — mismos campos que ya soporta el reporte
// Excel en el backend (admin_card_filters): folio, service_type, company,
// client, vehicle. Solo se muestran/aplican cuando `showFilters` está activo.
const folioSearch = ref('');
const selectedServiceTypes = ref<RescueServiceType[]>([]);
const company = ref(props.initialCompany ?? emptyCatalogDropdownSelection());
const client = ref(props.initialClient ?? emptyCatalogDropdownSelection());
const vehicles = ref<string[]>([]);

const administrativeServiceTypeOptions = RESCUE_SERVICE_TYPE_OPTIONS.filter(
  (option) =>
    (ADMINISTRATIVE_API_SERVICE_TYPES as readonly string[]).includes(
      option.value,
    ),
);

const serviceTypeFilterItems = [
  { label: 'Todos', value: null as RescueServiceType | null },
  ...administrativeServiceTypeOptions.map((option) => ({
    label: option.label,
    value: option.value,
  })),
];

const selectedServiceTypeFilter = computed({
  get: () =>
    selectedServiceTypes.value.length === 1
      ? selectedServiceTypes.value[0]!
      : null,
  set: (value: RescueServiceType | null) => {
    selectedServiceTypes.value = value != null ? [value] : [];
  },
});

function clearFilters() {
  folioSearch.value = '';
  selectedServiceTypes.value = [];
  company.value = emptyCatalogDropdownSelection();
  client.value = emptyCatalogDropdownSelection();
  vehicles.value = [];
}

const {
  fetchAdministrativeCompanyDropdown,
  fetchAdministrativeClientDropdown,
} = useAdministrativeBoardDropdownFetchers();

const internalFiltersQuery = computed(() => {
  const query = buildAdministrativeListQuery({
    folio: folioSearch.value,
    createdFrom: '',
    createdTo: '',
    serviceTypes: selectedServiceTypes.value,
    operativeStatus: null,
    billingStatus: null,
    company: company.value,
    manager: emptyCatalogDropdownSelection(),
    seller: emptyCatalogDropdownSelection(),
    client: client.value,
    vehicles: vehicles.value,
  });

  if (statusFilterType.value != null && statusFilterValues.value.length > 0) {
    const joined = statusFilterValues.value.join(',');
    if (statusFilterType.value === 'admin') {
      query.admin_status = joined;
    } else {
      query.operative_status = joined;
    }
  }

  return query;
});

async function handleDownload() {
  if (!canDownload.value || startDate.value == null || endDate.value == null) return;

  const ok = await downloadRescuesExcelReport({
    ...props.extraQuery,
    ...(props.showFilters ? internalFiltersQuery.value : {}),
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
    title="Reporte de rescates (Excel)"
    :description="showFilters
      ? 'Selecciona el status y el rango de fechas en que entraron a ese status, más los filtros a exportar'
      : 'Selecciona el rango de fechas a exportar'"
    :ui="{ content: showFilters ? 'max-w-xl' : 'max-w-md' }"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <template v-if="showFilters">
          <div class="flex flex-col gap-3">
            <UFormField
              label="Tipo de status"
              :ui="{ label: 'text-xs font-semibold uppercase tracking-wide text-muted' }"
            >
              <UFieldGroup>
                <UButton
                  label="Administrativo"
                  :color="statusFilterType === 'admin' ? 'primary' : 'neutral'"
                  :variant="statusFilterType === 'admin' ? 'solid' : 'subtle'"
                  :disabled="isDownloading"
                  @click="statusFilterType = 'admin'"
                />
                <UButton
                  label="Operativo"
                  :color="statusFilterType === 'operative' ? 'primary' : 'neutral'"
                  :variant="statusFilterType === 'operative' ? 'solid' : 'subtle'"
                  :disabled="isDownloading"
                  @click="statusFilterType = 'operative'"
                />
              </UFieldGroup>
            </UFormField>

            <UFormField
              v-if="statusFilterType != null"
              label="Status"
              :ui="{ label: 'text-xs font-semibold uppercase tracking-wide text-muted' }"
            >
              <USelectMenu
                v-model="statusFilterValues"
                multiple
                class="w-full"
                :items="statusValueOptions"
                value-key="value"
                label-key="label"
                placeholder="Selecciona uno o más"
                :disabled="isDownloading"
              />
            </UFormField>
          </div>

          <USeparator />
        </template>

        <p
          v-if="showFilters && statusFilterType != null"
          class="text-xs text-muted"
        >
          El rango de fechas se refiere a cuándo el rescate entró a los status seleccionados, no a su fecha de creación.
        </p>

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

        <template v-if="showFilters">
          <USeparator />

          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <UFormField
              label="Folio o cliente"
              :ui="{ label: 'text-xs font-semibold uppercase tracking-wide text-muted' }"
            >
              <UInput
                v-model="folioSearch"
                class="w-full"
                leading-icon="i-lucide-search"
                placeholder="Buscar…"
                :disabled="isDownloading"
              />
            </UFormField>

            <UFormField
              label="Tipo"
              :ui="{ label: 'text-xs font-semibold uppercase tracking-wide text-muted' }"
            >
              <USelect
                v-model="selectedServiceTypeFilter"
                class="w-full"
                :items="serviceTypeFilterItems"
                value-key="value"
                label-key="label"
                placeholder="Todos"
                :disabled="isDownloading"
              />
            </UFormField>

            <UFormField
              label="Compañía"
              :ui="{ label: 'text-xs font-semibold uppercase tracking-wide text-muted' }"
            >
              <CatalogDropdownSelect
                v-model="company"
                class="w-full"
                placeholder="Todas"
                :fetcher="fetchAdministrativeCompanyDropdown"
                :disabled="isDownloading"
              />
            </UFormField>

            <UFormField
              label="Cliente"
              :ui="{ label: 'text-xs font-semibold uppercase tracking-wide text-muted' }"
            >
              <CatalogDropdownSelect
                v-model="client"
                class="w-full"
                placeholder="Todos"
                :fetcher="fetchAdministrativeClientDropdown"
                :disabled="isDownloading"
              />
            </UFormField>

            <UFormField
              label="Vehículo"
              class="sm:col-span-2"
              :ui="{ label: 'text-xs font-semibold uppercase tracking-wide text-muted' }"
            >
              <SharedVehicleFilterInput
                v-model="vehicles"
                :client-id="client.value"
                :company-id="company.value"
                :disabled="isDownloading"
              />
            </UFormField>
          </div>

          <UButton
            color="neutral"
            label="Limpiar filtros"
            variant="link"
            class="self-start"
            :disabled="isDownloading"
            @click="clearFilters"
          />
        </template>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full flex-col gap-2">
        <ul
          v-if="missingFieldsMessages.length > 0"
          class="flex flex-col gap-0.5 text-xs text-warning"
        >
          <li
            v-for="message in missingFieldsMessages"
            :key="message"
            class="flex items-center gap-1"
          >
            <UIcon name="i-lucide-circle-alert" class="size-3.5 shrink-0" />
            {{ message }}
          </li>
        </ul>

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
      </div>
    </template>
  </UModal>
</template>
