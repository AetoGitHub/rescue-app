<script setup lang="ts">
import type { RescueCard } from '~/interfaces/rescue';

const props = defineProps<{
  card: RescueCard;
}>();

const emit = defineEmits<{
  select: [id: number];
}>();

const serviceTypeBadge = computed(() =>
  getRescueServiceTypeBadge(props.card.service_type),
);
const gestorInitials = computed(() =>
  getGestorInitials(props.card.operator_name),
);
const gestorBadgeColor = computed(() =>
  getGestorBadgeColor(props.card.admin_status),
);
const elapsedLabel = computed(() => getRescueCardElapsedLabel(props.card));
const salePrice = computed(() => formatRescueCardMoney(props.card.sub_total));
const advanceAmount = computed(() => getRescueCardAdvanceAmount(props.card));

const approvedAmount = computed(() => {
  if (props.card.operative_status !== 'approved') return null;
  const amount = (props.card as { approved_amount?: string | null })
    .approved_amount;
  return amount ? formatRescueCardMoney(amount) : null;
});

const collectedTotal = computed(() => {
  if (props.card.operative_status !== 'closed') return null;
  const total = (props.card as { total_collected?: string | null })
    .total_collected;
  return total ? formatRescueCardMoney(total) : null;
});

const showQuickChat = computed(
  () => props.card.operative_status !== 'requested',
);

function onCardClick() {
  emit('select', props.card.id);
}
</script>

<template>
  <UCard
    class="cursor-pointer transition-shadow hover:shadow-md"
    :ui="{
      root: 'overflow-hidden shadow-sm ring ring-default',
      body: 'space-y-3 p-3',
    }"
    @click="onCardClick"
  >
    <div class="flex items-start justify-between gap-2">
      <span class="text-sm font-semibold text-primary">
        {{ card.folio ?? '—' }}
      </span>
      <UBadge
        :color="serviceTypeBadge.color as 'info'"
        variant="subtle"
        size="sm"
        class="shrink-0 uppercase tracking-wide"
      >
        <UIcon :name="serviceTypeBadge.icon" class="size-3.5" />
        {{ serviceTypeBadge.label }}
      </UBadge>
    </div>

    <div class="space-y-0.5">
      <p class="text-sm font-semibold text-highlighted leading-snug">
        {{ card.client_name ?? 'Sin cliente' }}
      </p>
    </div>

    <div class="flex items-center justify-between gap-2 text-xs">
      <span
        class="inline-flex min-w-0 items-center gap-1 truncate"
        :class="card.supplier_name?.trim() ? 'text-muted' : 'text-error'"
      >
        <UIcon name="i-lucide-truck" class="size-3.5 shrink-0" />
        {{ card.supplier_name?.trim() ? card.supplier_name : 'Sin proveedor' }}
      </span>
      <span
        class="inline-flex shrink-0 items-center gap-1.5 font-medium text-highlighted"
      >
        {{ salePrice }}
        <UBadge
          :color="gestorBadgeColor as 'neutral'"
          variant="solid"
          size="sm"
          class="size-6 justify-center rounded-full p-0 text-[10px] font-bold uppercase"
        >
          {{ gestorInitials }}
        </UBadge>
      </span>
    </div>

    <div class="flex items-center justify-between gap-2 text-xs text-muted">
      <UBadge
        color="neutral"
        icon="i-lucide-timer"
        :label="elapsedLabel"
        variant="subtle"
      />
      <UBadge
        color="error"
        icon="i-lucide-clock-alert"
        label="SLA —"
        variant="subtle"
      />
    </div>

    <div
      v-if="card.operative_status === 'waiting_advance_payment'"
      class="space-y-1"
    >
      <UBadge color="primary" variant="subtle" size="sm">
        Anticipo: {{ advanceAmount }}
      </UBadge>
      <p class="text-xs text-muted">Pendiente de recibir</p>
    </div>

    <div
      v-else-if="card.operative_status === 'approved' && approvedAmount"
      class="text-xs text-muted"
    >
      Aprobado:
      <span class="font-medium text-highlighted">{{ approvedAmount }}</span>
    </div>

    <div
      v-else-if="card.operative_status === 'closed' && collectedTotal"
      class="text-xs text-muted"
    >
      Total cobrado:
      <span class="font-medium text-highlighted">{{ collectedTotal }}</span>
    </div>

    <USeparator />

    <div
      v-if="card.operative_status === 'requested'"
      class="space-y-2"
      @click.stop
    >
      <UBadge v-if="!card.operator_id" color="error" variant="subtle" size="sm">
        Sin gestor asignado
      </UBadge>
      <UButton block color="primary" label="Tomar solicitud" size="sm" />
    </div>

    <OperationalRescueCardQuickChat
      v-if="showQuickChat"
      :rescue-id="card.id"
    />
  </UCard>
</template>
