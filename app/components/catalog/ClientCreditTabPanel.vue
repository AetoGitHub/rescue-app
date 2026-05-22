<script setup lang="ts">
import type { CreditFormState, ClientCreditSummary } from '~/interfaces/catalogs/credit';
import {
  clientCreditUsagePercent,
  clientTypeBadgeProps,
  formatClientMoney,
} from '~/utils/client-list-display';

const props = defineProps<{
  clientName: string;
  creditSummary: ClientCreditSummary;
}>();

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

const usagePercent = computed(() =>
  clientCreditUsagePercent(
    props.creditSummary.credit_used,
    props.creditSummary.credit_limit,
  ),
);

const typeBadge = computed(() => clientTypeBadgeProps('CREDIT'));

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

      <div class="grid gap-6 lg:grid-cols-[auto_1fr]">
        <div class="flex flex-col items-center gap-2">
          <CatalogClientCreditUsageRing :percent="usagePercent" size="md" />
          <span class="text-xs font-medium uppercase tracking-wider text-muted">
            {{ usagePercent ?? 0 }}% usado
          </span>
        </div>

        <div
          v-if="!lineEditOpen"
          class="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          <div>
            <p class="text-xs uppercase tracking-wider text-muted">Límite</p>
            <p class="font-medium tabular-nums">
              {{ formatClientMoney(creditSummary.credit_limit) }}
            </p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-wider text-muted">Usado</p>
            <p class="font-medium tabular-nums">
              {{ formatClientMoney(creditSummary.credit_used) }}
            </p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-wider text-muted">Disponible</p>
            <p class="font-semibold tabular-nums text-primary">
              {{ formatClientMoney(creditSummary.credit_available) }}
            </p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-wider text-muted">
              Días de crédito
            </p>
            <p class="font-medium">{{ creditState.days }} días</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-wider text-muted">Prórroga</p>
            <p class="font-medium">{{ creditState.extension }} días</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-wider text-muted">
              Tolerancia remisión
            </p>
            <p class="font-medium">{{ creditState.remision_tolerance }} días</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-wider text-muted">Requiere OC</p>
            <p class="font-medium">
              {{ creditState.requires_purchase_order ? 'Sí' : 'No' }}
            </p>
          </div>
        </div>

        <div v-else class="space-y-4 sm:col-span-2">
          <UFormField label="Límite de crédito" required>
            <UInputNumber
              v-model="creditLimitModel"
              v-bind="catalogCurrencyInputProps"
            />
          </UFormField>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <UFormField label="Días de crédito" required>
              <UInputNumber
                v-model="creditDaysModel"
                v-bind="catalogIntegerInputProps"
              />
            </UFormField>
            <UFormField label="Prórroga (días)" required>
              <UInputNumber
                v-model="creditExtensionModel"
                v-bind="catalogIntegerInputProps"
              />
            </UFormField>
            <UFormField label="Tolerancia remisión (días)" required>
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
        </div>
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
      <h3 class="text-xs font-semibold uppercase tracking-wider text-primary">
        Facturas pendientes
      </h3>
      <div
        class="flex flex-col items-center gap-2 rounded-lg border border-dashed border-default py-8 text-center"
      >
        <UIcon name="i-lucide-circle-check" class="size-8 text-primary" />
        <p class="font-medium">Sin facturas pendientes</p>
        <p class="text-sm text-muted">El cliente está al corriente</p>
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
