<script setup lang="ts">
import type { AdministrativeRescueDetail } from '~/interfaces/rescue/administrative';

const props = defineProps<{
  detail: AdministrativeRescueDetail;
}>();

const amountLabel = computed(() => {
  const amount = props.detail.payment_amount?.trim();
  return amount ? formatRescueCardMoney(amount) : '—';
});

const dateLabel = computed(
  () => props.detail.payment_date?.trim() || '—',
);

const methodLabel = computed(() =>
  getRescuePaymentMethodLabel(props.detail.payment_method),
);
</script>

<template>
  <div
    class="space-y-4 rounded-lg border border-primary/30 bg-elevated/50 p-4"
  >
    <div class="flex items-center gap-2 text-primary">
      <UIcon
        name="i-lucide-circle-check"
        class="size-5 shrink-0"
      />
      <h3 class="text-sm font-semibold uppercase tracking-wide">
        Pagado
      </h3>
    </div>

    <dl class="grid gap-3 sm:grid-cols-3">
      <div class="space-y-1">
        <dt class="text-xs font-medium uppercase tracking-wide text-muted">
          Monto
        </dt>
        <dd class="text-sm font-semibold tabular-nums">
          {{ amountLabel }}
        </dd>
      </div>
      <div class="space-y-1">
        <dt class="text-xs font-medium uppercase tracking-wide text-muted">
          Fecha
        </dt>
        <dd class="text-sm font-semibold">
          {{ dateLabel }}
        </dd>
      </div>
      <div class="space-y-1">
        <dt class="text-xs font-medium uppercase tracking-wide text-muted">
          Forma
        </dt>
        <dd class="text-sm font-semibold">
          {{ methodLabel }}
        </dd>
      </div>
    </dl>
  </div>
</template>
