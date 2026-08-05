<script setup lang="ts">
import type { RescueAdvanceSummary } from '~/utils/rescue-disbursement-display';

const props = defineProps<{
  advance: RescueAdvanceSummary;
  isLoan: boolean;
  disbursementRegistered?: boolean;
  disbursementDate?: string | null;
  disbursementPaymentMethod?: string | null;
}>();

const advanceStatusKind = computed(() =>
  getRescueAdvanceStatusKind(props.advance),
);

const advanceStatusLabel = computed(() =>
  getRescueAdvanceStatusLabel(advanceStatusKind.value),
);

const advanceStatusColor = computed(() =>
  getRescueAdvanceStatusColor(advanceStatusKind.value),
);

const showAdvanceBlock = computed(
  () => !props.isLoan && hasRescueAdvanceSummary(props.advance),
);

const showAdvanceAmount = computed(
  () =>
    showAdvanceBlock.value
    && props.advance.advance_amount != null
    && String(props.advance.advance_amount).trim() !== '',
);

/** Loan-only: date + payment method when the loan was disbursed. */
const showDisbursementMeta = computed(
  () => props.isLoan && props.disbursementRegistered === true,
);

const sectionTitle = computed(() =>
  props.isLoan ? 'Desembolso' : 'Anticipo',
);
</script>

<template>
  <section
    class="space-y-3 rounded-lg border border-default bg-default p-4"
  >
    <h3 class="text-xs font-semibold uppercase tracking-wider text-muted">
      {{ sectionTitle }}
    </h3>

    <div class="space-y-2 text-sm">
      <template v-if="showAdvanceBlock">
        <div class="flex items-center justify-between gap-2">
          <span class="text-muted">Estado del anticipo</span>
          <UBadge
            :color="advanceStatusColor"
            variant="subtle"
            size="sm"
          >
            {{ advanceStatusLabel }}
          </UBadge>
        </div>

        <div
          v-if="showAdvanceAmount"
          class="flex items-center justify-between gap-2"
        >
          <span class="text-muted">Monto anticipo</span>
          <span class="font-medium tabular-nums text-highlighted">
            {{ formatDisbursementAdvanceAmount(advance.advance_amount) }}
          </span>
        </div>
      </template>

      <template v-if="showDisbursementMeta">
        <div class="flex items-center justify-between gap-2">
          <span class="text-muted">Fecha</span>
          <span class="font-medium text-highlighted">
            {{ formatDisbursementDate(disbursementDate) }}
          </span>
        </div>

        <div class="flex items-center justify-between gap-2">
          <span class="text-muted">Forma de pago</span>
          <span class="font-medium text-highlighted">
            {{ formatDisbursementPaymentMethod(disbursementPaymentMethod) }}
          </span>
        </div>
      </template>
    </div>
  </section>
</template>
