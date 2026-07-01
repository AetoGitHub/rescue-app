<script setup lang="ts">
import { useQueryCache } from '@pinia/colada';
import type { AsyncStatus } from '@pinia/colada';
import type { ContractItem } from '~/interfaces/catalogs/contract';
import {
  contractItemToEditableRow,
  editableRowToUpdateBody,
  formatContractMoney,
  formatContractPriceDifference,
  parseContractPrice,
  type ContractItemEditableRow,
} from '~/utils/contract-item-rows';

const props = defineProps<{
  contractId: number;
  items: ContractItem[];
  loading?: boolean;
  asyncStatus?: AsyncStatus;
  hasNextPage?: boolean;
  loadNextPage?: () => unknown;
}>();

const emit = defineEmits<{
  add: [];
}>();

const toast = useToast();
const queryCache = useQueryCache();

const bulkMultiplier = ref(1);
const bulkPercentIncrease = ref(0);
const savingIds = ref(new Set<number>());
const categoryByServiceId = ref<Record<number, string>>({});

const editableRows = ref<ContractItemEditableRow[]>([]);

watch(
  () => props.items,
  async (items) => {
    editableRows.value = items.map((item) =>
      contractItemToEditableRow(
        item,
        categoryByServiceId.value[item.service_id] || null,
      ),
    );
    await enrichCategories(items);
  },
  { immediate: true },
);

async function enrichCategories(items: ContractItem[]) {
  const missing = items.filter(
    (item) => categoryByServiceId.value[item.service_id] == null,
  );
  if (missing.length === 0) return;

  await Promise.all(
    missing.map(async (item) => {
      try {
        const raw = await $fetch<Record<string, unknown>>(
          `/api/catalogue/service/detail/${item.service_id}/`,
        );
        categoryByServiceId.value[item.service_id] = String(
          raw.category_name ?? '',
        ).trim();
      } catch {
        categoryByServiceId.value[item.service_id] = '';
      }
    }),
  );

  editableRows.value = props.items.map((item) =>
    contractItemToEditableRow(
      item,
      categoryByServiceId.value[item.service_id] || null,
    ),
  );
}

const saveTimers = new Map<number, ReturnType<typeof setTimeout>>();

async function persistRow(row: ContractItemEditableRow) {
  savingIds.value.add(row.id);
  try {
    await $fetch(`/api/catalogue/contract/item/update/${row.id}/`, {
      method: 'PUT',
      body: editableRowToUpdateBody(row),
    });
    await queryCache.invalidateQueries({
      key: ['contract-items', props.contractId],
    });
  } catch (e) {
    console.error(e);
    toast.add({
      title: 'No se pudo guardar el precio',
      description: getFetchErrorMessage(e),
      color: 'error',
    });
  } finally {
    savingIds.value.delete(row.id);
  }
}

function scheduleRowSave(row: ContractItemEditableRow) {
  const existing = saveTimers.get(row.id);
  if (existing) clearTimeout(existing);
  saveTimers.set(
    row.id,
    setTimeout(() => {
      saveTimers.delete(row.id);
      void persistRow(row);
    }, 600),
  );
}

function onPriceUpdate(row: ContractItemEditableRow, value: number | undefined) {
  row.price =
    value != null && Number.isFinite(value) ? value.toFixed(2) : '0.00';
  scheduleRowSave(row);
}

function applyMultiplierToAll() {
  const factor = bulkMultiplier.value;
  if (!Number.isFinite(factor) || factor <= 0) {
    toast.add({ title: 'Multiplicador inválido', color: 'warning' });
    return;
  }
  for (const row of editableRows.value) {
    const current = parseContractPrice(row.price_multiplier) || 1;
    row.price_multiplier = (current * factor).toFixed(2);
    scheduleRowSave(row);
  }
  toast.add({ title: 'Multiplicador aplicado a todos', color: 'success' });
}

function applyPercentIncreaseToAll() {
  const pct = bulkPercentIncrease.value;
  if (!Number.isFinite(pct)) {
    toast.add({ title: 'Porcentaje inválido', color: 'warning' });
    return;
  }
  const factor = 1 + pct / 100;
  for (const row of editableRows.value) {
    const current = parseContractPrice(row.price);
    row.price = (current * factor).toFixed(2);
    scheduleRowSave(row);
  }
  toast.add({ title: 'Aumento aplicado a todos', color: 'success' });
}

function onImportPrices() {
  toast.add({
    title: 'Importar precios',
    description: 'Esta función estará disponible próximamente.',
    color: 'info',
  });
}

const removingId = ref<number | null>(null);

const tableScrollRef = ref<HTMLElement | null>(null);
const hasNextPageRef = computed(() => props.hasNextPage ?? false);
const listAsyncStatus = computed(() => props.asyncStatus ?? 'idle');
const loadingMore = computed(
  () =>
    listAsyncStatus.value === 'loading'
    && editableRows.value.length > 0
    && props.loading !== true,
);

useScrollContainerInfiniteLoad({
  containerRef: tableScrollRef,
  hasNextPage: hasNextPageRef,
  loadNextPage: () => props.loadNextPage?.(),
  asyncStatus: listAsyncStatus,
  disabled: computed(() => props.loading === true),
});

async function confirmRemove(row: ContractItemEditableRow) {
  if (!import.meta.client) return;
  if (
    !window.confirm(
      `¿Eliminar «${row.service_name}» de los precios negociados?`,
    )
  ) {
    return;
  }
  removingId.value = row.id;
  try {
    await $fetch(`/api/catalogue/contract/item/delete/${row.id}/`, {
      method: 'DELETE',
    });
    toast.add({ title: 'Producto eliminado del contrato', color: 'success' });
    await queryCache.invalidateQueries({
      key: ['contract-items', props.contractId],
    });
  } catch (e) {
    console.error(e);
    toast.add({
      title: 'No se pudo eliminar',
      description: getFetchErrorMessage(e),
      color: 'error',
    });
  } finally {
    removingId.value = null;
  }
}
</script>

<template>
  <section class="space-y-4">
    <div>
      <h2 class="text-lg font-semibold tracking-tight">Precios negociados</h2>
      <p class="mt-1 text-sm text-muted">
        Estos precios reemplazan el precio base × multiplicador para este
        cliente.
      </p>
    </div>

    <div
      class="flex flex-wrap items-end gap-4 rounded-lg border border-default bg-elevated/30 p-4"
    >
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-sm text-muted">Aplicar multiplicador</span>
        <UInputNumber
          v-model="bulkMultiplier"
          v-bind="catalogNumberInputProps"
          :min="0"
          class="w-24"
        />
        <UButton
          type="button"
          label="Aplicar a todos"
          variant="subtle"
          size="sm"
          @click="applyMultiplierToAll"
        />
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-sm text-muted">Aumentar todos</span>
        <UInputNumber
          v-model="bulkPercentIncrease"
          v-bind="catalogIntegerInputProps"
          class="w-20"
        />
        <span class="text-sm text-muted">%</span>
        <UButton
          type="button"
          label="Aplicar a todos"
          variant="subtle"
          size="sm"
          @click="applyPercentIncreaseToAll"
        />
      </div>
    </div>

    <div
      ref="tableScrollRef"
      class="max-h-[32rem] overflow-x-auto overflow-y-auto rounded-lg border border-default"
    >
      <table class="w-full min-w-[640px] text-sm sm:min-w-[880px]">
        <thead>
          <tr
            class="border-b border-default bg-elevated/50 text-left text-xs font-medium uppercase tracking-wide text-muted"
          >
            <th class="px-3 py-2">Producto / servicio</th>
            <th class="hidden px-3 py-2 sm:table-cell">Categoría</th>
            <th class="hidden px-3 py-2 md:table-cell">Precio base</th>
            <th class="px-3 py-2">Precio negociado</th>
            <th class="hidden px-3 py-2 lg:table-cell">Diferencia</th>
            <th class="w-12 px-2 py-2" />
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading" class="border-b border-default">
            <td colspan="6" class="px-3 py-8 text-center text-muted">
              <UIcon
                name="i-lucide-loader-circle"
                class="mx-auto size-6 animate-spin"
              />
            </td>
          </tr>
          <tr
            v-for="row in editableRows"
            v-else
            :key="row.id"
            class="border-b border-default last:border-b-0"
          >
            <td class="px-3 py-2 font-medium">{{ row.service_name }}</td>
            <td class="hidden px-3 py-2 text-muted sm:table-cell">
              {{ row.category_name || '—' }}
            </td>
            <td class="hidden px-3 py-2 tabular-nums text-muted md:table-cell">
              {{ formatContractMoney(0) }}
            </td>
            <td class="px-3 py-2">
              <div class="flex items-center gap-2">
                <UInputNumber
                  :model-value="parseContractPrice(row.price)"
                  v-bind="catalogCurrencyInputProps"
                  :min="0"
                  class="min-w-32"
                  @update:model-value="(v) => onPriceUpdate(row, v ?? undefined)"
                />
                <UIcon
                  v-if="savingIds.has(row.id)"
                  name="i-lucide-loader-circle"
                  class="size-4 shrink-0 animate-spin text-muted"
                />
              </div>
            </td>
            <td class="hidden px-3 py-2 tabular-nums text-muted lg:table-cell">
              {{ formatContractPriceDifference(row.price, row.base_price) }}
            </td>
            <td class="px-2 py-2 text-center">
              <UButton
                type="button"
                color="neutral"
                variant="ghost"
                icon="i-lucide-trash-2"
                size="xs"
                aria-label="Eliminar"
                :loading="removingId === row.id"
                @click="confirmRemove(row)"
              />
            </td>
          </tr>
          <tr v-if="!loading && editableRows.length === 0">
            <td colspan="6" class="px-3 py-8 text-center text-muted">
              Sin productos en el contrato. Agrega el primero abajo.
            </td>
          </tr>
          <tr v-if="loadingMore">
            <td colspan="6" class="px-3 py-4 text-center text-muted">
              <UIcon
                name="i-lucide-loader-circle"
                class="mx-auto size-5 animate-spin"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <UButton
        type="button"
        block
        variant="outline"
        color="neutral"
        class="border-dashed sm:max-w-md"
        icon="i-lucide-plus"
        label="Agregar producto al contrato"
        @click="emit('add')"
      />
      <UButton
        type="button"
        label="Importar precios"
        variant="subtle"
        color="neutral"
        trailing-icon="i-lucide-upload"
        @click="onImportPrices"
      />
    </div>
  </section>
</template>
