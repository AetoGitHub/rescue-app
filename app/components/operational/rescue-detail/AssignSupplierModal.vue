<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui';
import type { RescueSupplierNearbyRow } from '~/interfaces/rescue';
import { RESCUE_SUPPLIER_SORT_OPTIONS } from '~/constants/rescue-select-options';
import {
  rescueSupplierAssignSchema,
  rescueSupplierAssignToBody,
  type RescueSupplierAssignFormState,
} from '~/schemas/rescue-supplier-assign';
import { z } from 'zod';

const open = defineModel<boolean>('open', { required: true });

const props = defineProps<{
  rescueId: number;
  latitude: string | null;
  longitude: string | null;
  currentSupplierId: number | null;
  currentSupplierName: string | null;
  loading?: boolean;
}>();

const emit = defineEmits<{
  saved: [];
}>();

const toast = useToast();
const formRef = ref<{ submit: () => Promise<void> } | null>(null);
const selectedLabel = ref('');

const state = reactive<RescueSupplierAssignFormState>({
  supplier: null,
});

const latRef = computed(() => props.latitude);
const lngRef = computed(() => props.longitude);

const {
  search,
  sort,
  suppliers,
  loading: searchLoading,
  errorMessage,
  distanceSortBlocked,
} = useRescueSupplierSearch({
  latitude: latRef,
  longitude: lngRef,
});

const { saveSupplier, isAssigning } = useRescueSupplierAssign(
  () => props.rescueId,
);

const modalTitle = computed(() =>
  props.currentSupplierId != null
    ? 'Cambiar proveedor'
    : 'Asignar proveedor',
);

const isBusy = computed(
  () => props.loading || isAssigning.value || searchLoading.value,
);

watch(open, (isOpen) => {
  if (isOpen) {
    state.supplier = props.currentSupplierId;
    selectedLabel.value = props.currentSupplierName?.trim() ?? '';
    search.value = '';
  }
});

function selectSupplier(row: RescueSupplierNearbyRow) {
  if (state.supplier === row.id) {
    state.supplier = null;
    selectedLabel.value = '';
    return;
  }
  state.supplier = row.id;
  selectedLabel.value = row.name;
}

function clearSelection() {
  state.supplier = null;
  selectedLabel.value = '';
}

function formatDistance(km: number | null) {
  if (km == null || !Number.isFinite(km)) return '—';
  return `${km.toFixed(1)} km`;
}

function formatRanking(value: number) {
  if (!Number.isFinite(value) || value <= 0) return '—';
  return value.toFixed(1);
}

async function onSubmit(event: FormSubmitEvent<z.infer<typeof rescueSupplierAssignSchema>>) {
  const body = rescueSupplierAssignToBody(event.data);

  const ok = await saveSupplier(body);
  if (ok) {
    open.value = false;
    emit('saved');
  }
}

async function onRemoveSupplier() {
  const ok = await saveSupplier({ supplier: null });
  if (ok) {
    open.value = false;
    emit('saved');
  }
}

function onSaveClick() {
  if (state.supplier == null) {
    toast.add({
      title: 'Selecciona un proveedor',
      color: 'error',
    });
    return;
  }
  void formRef.value?.submit();
}
</script>

<template>
  <UModal
    v-model:open="open"
    :dismissible="false"
    :title="modalTitle"
    :ui="{ content: 'max-w-lg' }"
  >
    <template #body>
      <UForm
        ref="formRef"
        :schema="rescueSupplierAssignSchema"
        :state="state"
        class="space-y-3"
        @submit="onSubmit"
      >
        <UInput
          v-model="search"
          leading-icon="i-lucide-search"
          placeholder="Buscar proveedor"
          class="w-full"
          variant="subtle"
        />

        <UFormField name="supplier" class="hidden" />

        <USelectMenu
          v-model="sort"
          :items="[...RESCUE_SUPPLIER_SORT_OPTIONS]"
          value-key="value"
          label-key="label"
          class="w-full"
          variant="subtle"
        />

        <p
          v-if="errorMessage"
          class="text-xs text-error"
          role="alert"
        >
          {{ errorMessage }}
        </p>

        <p
          v-else-if="distanceSortBlocked"
          class="text-xs text-muted"
        >
          Este rescate no tiene coordenadas para ordenar por distancia.
        </p>

        <div
          v-if="state.supplier != null"
          class="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm"
        >
          <span>
            Seleccionado:
            <strong>{{ selectedLabel || `#${state.supplier}` }}</strong>
          </span>
          <UButton
            type="button"
            size="xs"
            color="neutral"
            variant="ghost"
            label="Quitar"
            @click="clearSelection"
          />
        </div>

        <div class="max-h-64 overflow-y-auto rounded-lg border border-default">
          <div
            v-if="searchLoading"
            class="flex items-center justify-center py-12"
          >
            <UIcon
              name="i-lucide-loader-circle"
              class="size-8 animate-spin text-muted"
            />
          </div>
          <p
            v-else-if="distanceSortBlocked && sort === 'distance'"
            class="px-4 py-8 text-center text-sm text-muted"
          >
            Indica la ubicación del rescate para ver proveedores por distancia.
          </p>
          <p
            v-else-if="suppliers.length === 0"
            class="px-4 py-8 text-center text-sm text-muted"
          >
            No hay proveedores que coincidan con la búsqueda.
          </p>
          <ul v-else class="divide-y divide-default">
            <li
              v-for="row in suppliers"
              :key="row.id"
            >
              <button
                type="button"
                class="flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-elevated"
                :class="
                  state.supplier === row.id
                    ? 'bg-primary/10 ring-1 ring-inset ring-primary/40'
                    : ''
                "
                @click="selectSupplier(row)"
              >
                <div class="flex items-start justify-between gap-2">
                  <span class="font-medium">{{ row.name }}</span>
                  <UBadge
                    v-if="row.is_trusted"
                    color="warning"
                    variant="subtle"
                    size="sm"
                    class="shrink-0"
                  >
                    <UIcon name="i-lucide-star" class="size-4" />
                    Confianza
                  </UBadge>
                </div>
                <div class="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted">
                  <span class="inline-flex items-center gap-1">
                    <UIcon name="i-lucide-star" class="size-3.5 shrink-0" />
                    {{ formatRanking(row.score) }}
                  </span>
                  <span class="inline-flex items-center gap-1">
                    <UIcon name="i-lucide-phone" class="size-3.5 shrink-0" />
                    {{ row.phone || '—' }}
                  </span>
                  <span class="inline-flex items-center gap-1">
                    <UIcon name="i-lucide-truck" class="size-3.5 shrink-0" />
                    {{ formatSupplierRescuesCount(row.rescues_count) }}
                  </span>
                  <span class="inline-flex items-center gap-1">
                    <UIcon name="i-lucide-map-pin" class="size-3.5 shrink-0" />
                    {{ formatDistance(row.distance_km) }}
                  </span>
                </div>
              </button>
            </li>
          </ul>
        </div>
      </UForm>
    </template>

    <template #footer>
      <div class="flex w-full flex-wrap items-center justify-between gap-2">
        <UButton
          v-if="currentSupplierId != null"
          color="error"
          label="Quitar proveedor"
          variant="ghost"
          :loading="isAssigning"
          :disabled="isBusy"
          @click="onRemoveSupplier"
        />
        <div class="ml-auto flex gap-2">
          <UButton
            color="neutral"
            label="Cancelar"
            variant="subtle"
            :disabled="isBusy"
            @click="open = false"
          />
          <UButton
            color="primary"
            label="Guardar"
            :loading="isAssigning"
            :disabled="isBusy"
            @click="onSaveClick"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
