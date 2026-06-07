<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui';
import type { infer as ZodInfer } from 'zod';
import type {
  ClientCreditInvoice,
  CreditFormState,
  ClientCreditSummary,
  CreditTemporaryUnlock,
  CreditUnlockCreateBody,
} from '~/interfaces/catalogs/credit';
import { creditFormSchema } from '~/schemas/catalog-create';
import {
  clientCreditUsagePercent,
  clientTypeBadgeProps,
  formatClientMoney,
} from '~/utils/client-list-display';

type CreditMetricRow = {
  id: string;
  label: string;
  value: string;
  highlight?: boolean;
};

const props = defineProps<{
  clientId?: number | null;
  companyId?: number | null;
  creditId?: number | null;
  clientName: string;
  clientType: string;
  creditSummary: ClientCreditSummary;
  hasCreditLine?: boolean;
  invoices?: ClientCreditInvoice[];
  invoicesLoading?: boolean;
  hasMoreInvoices?: boolean;
}>();

const emit = defineEmits<{
  loadMoreInvoices: [];
  creditSubmit: [payload: FormSubmitEvent<ZodInfer<typeof creditFormSchema>>];
  creditError: [];
}>();

const creditFormRef = ref<{ submit: () => Promise<void> } | null>(null);

const isActive = defineModel<boolean>('isActive', { required: true });
const creditState = defineModel<CreditFormState>('creditState', { required: true });

const creditLimitSource = computed({
  get: () => creditState.value.limit,
  set: (value: string) => {
    creditState.value.limit = value;
  },
});
const creditDaysSource = computed({
  get: () => creditState.value.days,
  set: (value: number) => {
    creditState.value.days = value;
  },
});
const creditExtensionSource = computed({
  get: () => creditState.value.extension,
  set: (value: number) => {
    creditState.value.extension = value;
  },
});
const creditRemisionToleranceSource = computed({
  get: () => creditState.value.remision_tolerance,
  set: (value: number) => {
    creditState.value.remision_tolerance = value;
  },
});

const creditLimitModel = useStringNumberModel(creditLimitSource);
const creditDaysModel = useRequiredIntegerModel(creditDaysSource);
const creditExtensionModel = useRequiredIntegerModel(creditExtensionSource);
const creditRemisionToleranceModel = useRequiredIntegerModel(
  creditRemisionToleranceSource,
);

const lineEditOpen = ref(false);
const historyOpen = ref(false);
const unlockCreateOpen = ref(false);
const cancelUnlockOpen = ref(false);
const cancelUnlockTarget = ref<CreditTemporaryUnlock | null>(null);

const creditUnlockList = useCreditUnlockList({
  companyId: computed(() => props.companyId ?? null),
  creditId: computed(() => props.creditId ?? null),
  activeFilter: 'active',
  enabled: computed(
    () =>
      props.companyId != null
      && props.creditId != null
      && props.clientId != null,
  ),
});

const creditUnlockMutations = useCreditUnlockMutations({
  companyId: computed(() => props.companyId ?? null),
  clientId: computed(() => props.clientId ?? null),
});

const unlockRows = computed(() => creditUnlockList.rows.value);
const unlocksLoading = computed(() => creditUnlockList.isInitialLoading.value);
const hasMoreUnlocks = computed(() => creditUnlockList.hasNextPage.value);
const canCreateUnlock = computed(() => props.creditId != null);
const canListUnlocks = computed(
  () => props.companyId != null && props.creditId != null,
);

function unlockModeLabel(mode: CreditTemporaryUnlock['mode']): string {
  return mode === 'money' ? 'Monto' : 'Días';
}

function formatUnlockDate(iso: string | null | undefined): string {
  if (!iso?.trim()) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function openUnlockHistory() {
  if (props.clientId == null) return;
  void navigateTo(`/admin/catalogs/clients/${props.clientId}/credit-unlocks`);
}

async function onCreateUnlock(body: CreditUnlockCreateBody) {
  try {
    await creditUnlockMutations.createUnlock(body);
    unlockCreateOpen.value = false;
    await creditUnlockList.refresh();
  } catch {
    // Toast handled in mutation
  }
}

function requestCancelUnlock(row: CreditTemporaryUnlock) {
  cancelUnlockTarget.value = row;
  cancelUnlockOpen.value = true;
}

async function confirmCancelUnlock() {
  const target = cancelUnlockTarget.value;
  if (target == null) return;
  try {
    await creditUnlockMutations.cancelUnlock(target.id);
    cancelUnlockOpen.value = false;
    cancelUnlockTarget.value = null;
    await creditUnlockList.refresh();
  } catch {
    // Toast handled in mutation
  }
}

watch(cancelUnlockOpen, (isOpen) => {
  if (!isOpen) cancelUnlockTarget.value = null;
});

function onCreditFormSubmit(
  payload: FormSubmitEvent<ZodInfer<typeof creditFormSchema>>,
) {
  emit('creditSubmit', payload);
}

async function submitCreditForm() {
  await creditFormRef.value?.submit();
}

defineExpose({ submitCreditForm });

const usagePercent = computed(() =>
  clientCreditUsagePercent(
    props.creditSummary.credit_used,
    props.creditSummary.credit_limit,
  ),
);

const typeBadge = computed(() => clientTypeBadgeProps(props.clientType));

const overdueAmount = computed(() =>
  formatClientMoney(props.creditSummary.overdue_amount ?? 0),
);
const dueSoonAmount = computed(() =>
  formatClientMoney(props.creditSummary.due_soon_amount ?? 0),
);
const overdueCount = computed(
  () => props.creditSummary.overdue_invoices_count ?? 0,
);
const dueSoonCount = computed(
  () => props.creditSummary.due_soon_invoices_count ?? 0,
);

function toggleBlockClient() {
  creditState.value.is_blocked = !creditState.value.is_blocked;
}

function formatInvoiceDate(iso: string | undefined): string {
  if (!iso?.trim()) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function invoiceOverdueLabel(days: number | undefined): string | null {
  if (days == null || days <= 0) return null;
  return `${days}d vencida`;
}

const invoiceRows = computed(() => props.invoices ?? []);

const creditMetricRows = computed((): CreditMetricRow[] => [
  {
    id: 'limit',
    label: 'Límite',
    value: formatClientMoney(props.creditSummary.credit_limit),
  },
  {
    id: 'used',
    label: 'Usado',
    value: formatClientMoney(props.creditSummary.credit_used),
  },
  {
    id: 'available',
    label: 'Disponible',
    value: formatClientMoney(props.creditSummary.credit_available),
    highlight: true,
  },
  {
    id: 'days',
    label: 'Días de crédito',
    value: `${creditState.value.days} días`,
  },
  {
    id: 'extension',
    label: 'Prórroga',
    value: `${creditState.value.extension} días`,
  },
  {
    id: 'tolerance',
    label: 'Tolerancia remisión',
    value: `${creditState.value.remision_tolerance} días`,
  },
  {
    id: 'po',
    label: 'Requiere OC',
    value: creditState.value.requires_purchase_order ? 'Sí' : 'No',
  },
]);
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto pe-1">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-wrap items-center gap-2">
        <h2 class="text-lg font-semibold tracking-tight uppercase">
          {{ clientName }}
        </h2>
        <UBadge
          :color="typeBadge.color"
          :variant="typeBadge.variant"
          :label="typeBadge.label"
        />
      </div>
      <UCheckbox
        v-model="isActive"
        label="Cliente activo"
        :ui="{ label: 'text-xs font-semibold uppercase tracking-wider' }"
      />
    </div>

    <UPageCard class="space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h3 class="text-xs font-semibold uppercase tracking-wider text-primary">
          Línea de crédito
        </h3>
        <UButton
          v-if="!lineEditOpen"
          label="Editar"
          color="neutral"
          variant="outline"
          size="sm"
          @click="lineEditOpen = true"
        />
        <UButton
          v-else
          label="Cerrar edición"
          color="neutral"
          variant="ghost"
          size="sm"
          @click="lineEditOpen = false"
        />
      </div>

      <div class="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div
          class="flex min-w-0 flex-1 basis-0 flex-col items-center justify-center gap-2"
        >
          <CatalogClientCreditUsageRing :percent="usagePercent" size="lg" />
          <span class="text-xs font-medium uppercase tracking-wider text-muted">
            USADO
          </span>
        </div>

        <ul
          v-if="!lineEditOpen"
          class="min-w-0 flex-1 basis-0 divide-y divide-default border-t border-default"
        >
          <li
            v-for="row in creditMetricRows"
            :key="row.id"
            class="flex items-center justify-between gap-4 py-3"
          >
            <span class="text-xs uppercase tracking-wider text-muted">
              {{ row.label }}
            </span>
            <span
              :class="[
                'shrink-0 text-end font-semibold tabular-nums',
                row.highlight ? 'text-primary' : 'text-default',
              ]"
            >
              {{ row.value }}
            </span>
          </li>
        </ul>

        <UForm
          v-show="lineEditOpen"
          ref="creditFormRef"
          :schema="creditFormSchema"
          :state="creditState"
          class="min-w-0 flex-1 basis-0 space-y-4"
          @submit="onCreditFormSubmit"
          @error="emit('creditError')"
        >
          <UFormField label="Límite de crédito" name="limit" required>
            <UInputNumber
              v-model="creditLimitModel"
              v-bind="catalogCurrencyInputProps"
            />
          </UFormField>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <UFormField label="Días de crédito" name="days" required>
              <UInputNumber
                v-model="creditDaysModel"
                v-bind="catalogIntegerInputProps"
              />
            </UFormField>
            <UFormField label="Prórroga (días)" name="extension" required>
              <UInputNumber
                v-model="creditExtensionModel"
                v-bind="catalogIntegerInputProps"
              />
            </UFormField>
            <UFormField label="Tolerancia remisión (días)" name="remision_tolerance" required>
              <UInputNumber
                v-model="creditRemisionToleranceModel"
                v-bind="catalogIntegerInputProps"
              />
            </UFormField>
          </div>
          <UFormField name="requires_purchase_order">
            <UCheckbox
              v-model="creditState.requires_purchase_order"
              label="El cliente requiere orden de compra"
            />
          </UFormField>
          <UFormField name="is_blocked">
            <UCheckbox
              v-model="creditState.is_blocked"
              label="Bloquear crédito del cliente"
            />
          </UFormField>
        </UForm>
      </div>
    </UPageCard>

    <div class="grid gap-4 sm:grid-cols-2">
      <UPageCard
        class="border border-error/30 bg-error/5"
        :ui="{ body: 'space-y-1' }"
      >
        <p class="text-xs font-semibold uppercase tracking-wider text-error">
          Vencido
        </p>
        <p class="text-xl font-semibold tabular-nums text-error">
          {{ overdueAmount }}
        </p>
        <p class="text-sm text-muted">{{ overdueCount }} factura(s)</p>
      </UPageCard>
      <UPageCard
        class="border border-warning/30 bg-warning/5"
        :ui="{ body: 'space-y-1' }"
      >
        <p class="text-xs font-semibold uppercase tracking-wider text-warning">
          Por vencer
        </p>
        <p class="text-xl font-semibold tabular-nums text-warning">
          {{ dueSoonAmount }}
        </p>
        <p class="text-sm text-muted">{{ dueSoonCount }} factura(s)</p>
      </UPageCard>
    </div>

    <UPageCard class="space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h3 class="text-xs font-semibold uppercase tracking-wider text-primary">
          Acciones de cobranza
        </h3>
      </div>
      <p class="text-sm text-muted">
        Bloquear nuevas solicitudes para este cliente
      </p>
      <UButton
        :label="creditState.is_blocked ? 'Desbloquear cliente' : 'Bloquear cliente'"
        :icon="creditState.is_blocked ? 'i-lucide-lock-open' : 'i-lucide-lock'"
        color="error"
        variant="outline"
        @click="toggleBlockClient"
      />
    </UPageCard>

    <UPageCard class="space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h3 class="text-xs font-semibold uppercase tracking-wider text-primary">
          Extensiones de crédito
        </h3>
        <div class="flex flex-wrap items-center gap-2">
          <UButton
            v-if="clientId != null"
            label="Ver historial completo"
            color="neutral"
            variant="ghost"
            size="sm"
            @click="openUnlockHistory"
          />
          <UButton
            label="Crear"
            icon="i-lucide-plus"
            size="sm"
            color="neutral"
            variant="outline"
            :disabled="!canCreateUnlock"
            @click="unlockCreateOpen = true"
          />
        </div>
      </div>

      <p v-if="!canCreateUnlock" class="text-sm text-muted">
        Configura una línea de crédito para crear extensiones.
      </p>
      <p v-else-if="!canListUnlocks" class="text-sm text-muted">
        Asigna una compañía al cliente para ver las extensiones activas.
      </p>

      <div v-if="unlocksLoading" class="flex justify-center py-8">
        <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-muted" />
      </div>
      <div
        v-else-if="canListUnlocks && unlockRows.length === 0"
        class="flex flex-col items-center gap-2 rounded-lg border border-dashed border-default py-8 text-center"
      >
        <UIcon name="i-lucide-shield-plus" class="size-8 text-primary" />
        <p class="font-medium">Sin extensiones activas</p>
        <p class="text-sm text-muted">
          Crea un desbloqueo temporal por monto o días de gracia.
        </p>
      </div>
      <ul
        v-else-if="canListUnlocks"
        class="divide-y divide-default rounded-lg border border-default"
      >
        <li
          v-for="unlock in unlockRows"
          :key="unlock.id"
          class="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
        >
          <div class="min-w-0 space-y-1">
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-semibold">{{ unlockModeLabel(unlock.mode) }}</span>
              <UBadge color="success" variant="subtle" label="Activa" />
            </div>
            <p class="text-sm text-muted">
              Creada: {{ formatUnlockDate(unlock.created_at) }}
            </p>
            <p v-if="unlock.mode === 'days'" class="text-sm text-muted">
              Expira: {{ formatUnlockDate(unlock.expires_at) }}
            </p>
          </div>
          <div class="flex shrink-0 flex-col items-end gap-2">
            <div class="text-end text-sm">
              <p class="font-semibold tabular-nums">
                {{
                  unlock.mode === 'money'
                    ? formatClientMoney(unlock.value)
                    : `${unlock.value} días`
                }}
              </p>
              <p
                v-if="unlock.mode === 'money'"
                class="text-muted tabular-nums"
              >
                Restante: {{ formatClientMoney(unlock.remaining) }}
              </p>
            </div>
            <UButton
              label="Cancelar"
              color="error"
              variant="outline"
              size="xs"
              :loading="creditUnlockMutations.isCancelling.value"
              @click="requestCancelUnlock(unlock)"
            />
          </div>
        </li>
      </ul>
      <div
        v-if="canListUnlocks && hasMoreUnlocks && unlockRows.length > 0"
        class="flex justify-center pt-2"
      >
        <UButton
          label="Cargar más"
          color="neutral"
          variant="outline"
          size="sm"
          @click="creditUnlockList.loadNextPage()"
        />
      </div>
    </UPageCard>

    <CatalogClientCreditUnlockCreateModal
      v-if="creditId != null"
      v-model:open="unlockCreateOpen"
      :credit-id="creditId"
      :loading="creditUnlockMutations.isCreating.value"
      @submit="onCreateUnlock"
    />

    <UModal
      v-model:open="cancelUnlockOpen"
      title="Cancelar extensión"
      :ui="{ content: 'max-w-md' }"
    >
      <template #body>
        <p class="text-sm text-muted">
          ¿Cancelar la extensión activa de
          {{
            cancelUnlockTarget?.mode === 'money'
              ? formatClientMoney(cancelUnlockTarget?.value ?? 0)
              : `${cancelUnlockTarget?.value ?? 0} días`
          }}?
        </p>
      </template>
      <template #footer="{ close }">
        <div class="flex w-full justify-end gap-2">
          <UButton
            type="button"
            color="neutral"
            label="Volver"
            variant="subtle"
            @click="close()"
          />
          <UButton
            type="button"
            label="Confirmar cancelación"
            color="error"
            :loading="creditUnlockMutations.isCancelling.value"
            @click="confirmCancelUnlock"
          />
        </div>
      </template>
    </UModal>

    <UPageCard class="space-y-3">
      <h3 class="text-xs font-semibold uppercase tracking-wider text-primary">
        Facturas pendientes
      </h3>
      <div v-if="invoicesLoading" class="flex justify-center py-8">
        <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-muted" />
      </div>
      <div
        v-else-if="invoiceRows.length === 0"
        class="flex flex-col items-center gap-2 rounded-lg border border-dashed border-default py-8 text-center"
      >
        <UIcon name="i-lucide-circle-check" class="size-8 text-primary" />
        <p class="font-medium">Sin facturas pendientes</p>
        <p class="text-sm text-muted">El cliente está al corriente</p>
      </div>
      <ul v-else class="divide-y divide-default rounded-lg border border-default">
        <li
          v-for="invoice in invoiceRows"
          :key="invoice.id"
          class="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
        >
          <div class="min-w-0 space-y-1">
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-semibold tabular-nums">
                {{ invoice.folio ?? `#${invoice.id}` }}
              </span>
              <UBadge
                v-if="invoiceOverdueLabel(invoice.days_overdue)"
                color="error"
                variant="subtle"
                :label="invoiceOverdueLabel(invoice.days_overdue)!"
              />
            </div>
            <p class="text-sm text-muted">
              Facturada: {{ formatInvoiceDate(invoice.billed_at) }}
            </p>
          </div>
          <span class="shrink-0 font-semibold tabular-nums text-default">
            {{ formatClientMoney(invoice.amount) }}
          </span>
        </li>
      </ul>
      <div v-if="hasMoreInvoices && invoiceRows.length > 0" class="flex justify-center pt-2">
        <UButton
          label="Cargar más"
          color="neutral"
          variant="outline"
          size="sm"
          @click="emit('loadMoreInvoices')"
        />
      </div>
    </UPageCard>

    <UPageCard class="space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h3 class="text-xs font-semibold uppercase tracking-wider text-primary">
          Promesas de pago
        </h3>
        <UButton
          label="Nueva"
          icon="i-lucide-plus"
          size="sm"
          color="neutral"
          variant="outline"
          disabled
        />
      </div>
      <p class="text-sm text-muted">Sin promesas registradas</p>
    </UPageCard>

    <UPageCard>
      <UCollapsible v-model:open="historyOpen">
        <div class="flex items-center justify-between gap-2">
          <h3 class="text-xs font-semibold uppercase tracking-wider text-primary">
            Historial de pagos (0)
          </h3>
          <UButton
            :label="historyOpen ? 'Ocultar' : 'Mostrar'"
            color="neutral"
            variant="ghost"
            size="sm"
          />
        </div>
        <template #content>
          <p class="pt-3 text-sm text-muted">Sin pagos registrados</p>
        </template>
      </UCollapsible>
    </UPageCard>
  </div>
</template>
