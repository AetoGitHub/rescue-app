<script setup lang="ts">
import { useMutation, useQueryCache } from '@pinia/colada';
import type { TableColumn } from '@nuxt/ui';
import type { ContractItem } from '~/interfaces/catalogs/contract';
import type { infer as ZodInfer } from 'zod';
import {
  contractHeaderFormToUpdateBody,
  contractHeaderUpdateSchema,
} from '~/schemas/catalog-create';
import { CLIENT_TYPE_OPTIONS } from '~/constants/catalog-select-options';

const route = useRoute();
const toast = useToast();
const queryCache = useQueryCache();
const UButton = resolveComponent('UButton');

const contractId = computed(() => Number(route.params.contractId));

const itemSlideoverRef = ref<{
  prepareCreate: () => void;
  openEdit: (item: ContractItem) => void;
} | null>(null);

const headerState = reactive({
  notes: '',
});

const apiFetch = useApiFetch();

const { data: contractDetail, isPending: detailPending } = useQuery({
  key: () => ['contract-detail', contractId.value],
  query: () =>
    apiFetch<Record<string, unknown>>(
      `/api/catalogue/contract/detail/${contractId.value}/`,
    ),
});

const clientId = computed(() => {
  if (contractDetail.value == null) return null;
  return mapContractHeaderDetail(contractDetail.value).client ?? null;
});

const { data: clientDetail, isPending: clientPending } = useQuery({
  key: () => ['client-detail', clientId.value],
  query: async () => {
    const id = clientId.value;
    if (id == null) return null;
    const raw = await apiFetch<Record<string, unknown>>(
      `/api/catalogue/client/detail/${id}/`,
    );
    return mapClientDetail(raw);
  },
});

watch(
  contractDetail,
  (raw) => {
    if (raw == null) return;
    headerState.notes = mapContractHeaderDetail(raw).notes;
  },
  { immediate: true },
);

const pagePending = computed(
  () => detailPending.value || (clientId.value != null && clientPending.value),
);

const contractActive = computed(() => Boolean(contractDetail.value?.is_active));

const clientTypeLabel = computed(() => {
  const type = clientDetail.value?.client_type;
  if (type == null) return '';
  const option = CLIENT_TYPE_OPTIONS.find((entry) => entry.value === type);
  return (option?.label ?? type).toUpperCase();
});

const clientCreditLabel = computed(() => {
  const balance = clientDetail.value?.credit_balance;
  if (balance == null || balance === '') return null;
  const amount = Number(balance.replace(/,/g, ''));
  if (Number.isNaN(amount)) return balance;
  return amount.toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
});

const multiplierLabel = computed(() => {
  const value = Number(clientDetail.value?.price_multiplier ?? '1');
  return `${Number.isNaN(value) ? '1.00' : value.toFixed(2)}x`;
});

const contractTitle = computed(
  () =>
    clientDetail.value?.business_name || clientDetail.value?.name || 'Contrato',
);

const itemsTableRef = useTemplateRef('itemsTable');

const {
  rows: itemRows,
  asyncStatus: itemsAsyncStatus,
  hasNextPage: itemsHasNextPage,
  loadNextPage: loadNextItemsPage,
  isInitialLoading: itemsInitialLoading,
} = useCatalogInfiniteList<ContractItem>({
  key: () => ['contract-items', contractId.value],
  path: `/api/catalogue/contract/${contractId.value}/items/`,
});

usePaginatedTableInfiniteScroll({
  tableRef: itemsTableRef,
  hasNextPage: itemsHasNextPage,
  loadNextPage: loadNextItemsPage,
  asyncStatus: itemsAsyncStatus,
});

const { mutate: saveHeader, asyncStatus: headerSaveStatus } = useMutation({
  mutation: (body: ReturnType<typeof contractHeaderFormToUpdateBody>) =>
    $fetch(`/api/catalogue/contract/update/${contractId.value}/`, {
      method: 'PATCH',
      body,
    }),
  async onSuccess() {
    toast.add({
      title: 'Contrato actualizado',
      color: 'success',
    });
    await queryCache.invalidateQueries({
      key: ['contract-detail', contractId.value],
    });
    await queryCache.invalidateQueries({ key: ['contracts'] });
  },
  onError: (e) => {
    console.error(e);
    toast.add({
      title: 'No se pudo guardar el contrato',
      description: getFetchErrorMessage(e),
      color: 'error',
    });
  },
});

const headerFormRef = ref<{ submit: () => Promise<void> } | null>(null);

function onHeaderSubmit(payload: {
  data: ZodInfer<typeof contractHeaderUpdateSchema>;
}) {
  saveHeader(contractHeaderFormToUpdateBody(payload.data));
}

function onHeaderFormError() {
  console.error('Validación de formulario de contrato');
}

async function requestHeaderSave() {
  await headerFormRef.value?.submit();
}

function openCreateItem() {
  itemSlideoverRef.value?.prepareCreate();
}

function openEditItem(item: ContractItem) {
  itemSlideoverRef.value?.openEdit(item);
}

const columns: TableColumn<ContractItem>[] = [
  {
    accessorKey: 'service_name',
    header: 'Servicio',
  },
  {
    accessorKey: 'price',
    header: 'Precio',
  },
  {
    accessorKey: 'price_multiplier',
    header: 'Multiplicador',
  },
  {
    accessorKey: 'percentaje',
    header: 'Porcentaje',
  },
  {
    accessorKey: 'notes',
    header: 'Notas',
  },
  {
    accessorKey: 'is_active',
    header: 'Estado',
    cell: ({ row }) => (row.original.is_active ? 'Activo' : 'Inactivo'),
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) =>
      h(UButton, {
        label: 'Editar',
        size: 'sm',
        variant: 'subtle',
        onClick: () => openEditItem(row.original),
      }),
  },
];

useHead({
  title: computed(() =>
    contractTitle.value !== 'Contrato'
      ? `Contrato · ${contractTitle.value}`
      : 'Contrato',
  ),
});
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <SharedNavbar title="Contrato" />
    </template>
    <template #body>
      <UContainer>
        <div class="space-y-4 pb-6">
          <div class="flex items-center justify-between gap-4">
            <UButton
              to="/admin/catalogs/contracts"
              icon="i-lucide-arrow-left"
              label="Contratos"
              color="neutral"
              variant="ghost"
            />
            <div class="flex items-center gap-2">
              <UButton
                to="/admin/catalogs/contracts"
                label="Cancelar"
                color="neutral"
                variant="ghost"
              />
              <UButton
                type="button"
                label="Guardar"
                :loading="headerSaveStatus === 'loading'"
                :disabled="headerSaveStatus === 'loading' || pagePending"
                @click="requestHeaderSave"
              />
            </div>
          </div>

          <div v-if="pagePending" class="flex justify-center py-8">
            <UIcon
              name="i-lucide-loader-circle"
              class="size-8 animate-spin text-muted"
            />
          </div>

          <template v-else>
            <h1 class="text-2xl font-bold uppercase tracking-tight">
              Contrato – {{ contractTitle }}
            </h1>
            <div
              v-if="clientDetail"
              class="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted"
            >
              <UBadge :label="clientTypeLabel" color="neutral" />
              <UBadge
                v-if="
                  clientDetail.client_type === 'CREDIT' && clientCreditLabel
                "
                :label="clientCreditLabel"
                color="neutral"
              />
              <span
                >Multiplicador:
                <span class="font-bold">{{ multiplierLabel }}</span></span
              >
              <span class="inline-flex items-center gap-1.5 text-default">
                <UIcon
                  :name="
                    contractActive ? 'i-lucide-square-check' : 'i-lucide-square'
                  "
                  class="size-4 text-primary"
                />
                {{ contractActive ? 'Contrato activo' : 'Contrato inactivo' }}
              </span>
            </div>
          </template>
        </div>

        <USeparator />

        <div v-if="!pagePending" class="space-y-8 py-4">
          <section class="space-y-4">
            <h2
              class="text-xs font-semibold uppercase tracking-wider text-primary"
            >
              Convenios
            </h2>
            <UTable
              ref="itemsTable"
              sticky
              class="h-80"
              :columns="columns"
              :data="itemRows"
              :loading="itemsInitialLoading"
              :get-row-id="(row: ContractItem) => String(row.id)"
            />
            <div class="flex justify-end">
              <UButton
                icon="i-lucide-plus"
                label="Agregar convenio"
                variant="subtle"
                :disabled="pagePending"
                @click="openCreateItem"
              />
            </div>
          </section>

          <UPageCard class="space-y-4">
            <UForm
              ref="headerFormRef"
              :schema="contractHeaderUpdateSchema"
              :state="headerState"
              class="space-y-4"
              @submit="onHeaderSubmit"
              @error="onHeaderFormError"
            >
              <UFormField label="Notas" name="notes">
                <textarea
                  v-model="headerState.notes"
                  class="w-full min-h-24 rounded-lg border border-default px-3 py-2 text-sm bg-default"
                  rows="4"
                />
              </UFormField>
            </UForm>
          </UPageCard>
        </div>

        <CatalogContractItemFormSlideover
          ref="itemSlideoverRef"
          :contract-id="contractId"
        />
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
