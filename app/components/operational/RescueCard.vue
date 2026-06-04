<script setup lang="ts">
import { useNow } from '@vueuse/core';
import type { RescueCard } from '~/interfaces/rescue';

const props = defineProps<{
  card: RescueCard;
}>();

const emit = defineEmits<{
  select: [id: number];
}>();

const { settings } = useRescueGeneralSettings();
const now = useNow({ interval: 30_000 });

const serviceTypeBadge = computed(() =>
  getRescueServiceTypeBadge(props.card.service_type),
);
const gestorInitials = computed(() =>
  getGestorInitials(props.card.operator_name),
);
const gestorBadgeColor = computed(() =>
  getGestorBadgeColor(props.card.admin_status),
);
const salePrice = computed(() => formatRescueCardMoney(props.card.sub_total));
const advanceAmount = computed(() => getRescueCardAdvanceAmount(props.card));

const chatBadge = computed(() =>
  getOperationalChatBadgeState(
    props.card,
    settings.value,
    now.value.getTime(),
  ),
);

const slaBadge = computed(() =>
  getOperationalSlaBadgeState(
    props.card,
    settings.value,
    now.value.getTime(),
  ),
);

const hasCriticalAlert = computed(
  () =>
    chatBadge.value.color === 'error'
    || slaBadge.value.color === 'error',
);

const approvedAmount = computed(() => {
  if (props.card.operative_status !== 'approved') return null;
  const amount = (props.card as { approved_amount?: string | null })
    .approved_amount;
  return amount ? formatRescueCardMoney(amount) : null;
});

const showQuickChat = computed(
  () => props.card.operative_status !== 'requested',
);

const supplierLabel = computed(() =>
  props.card.supplier_name?.trim() ? props.card.supplier_name : 'Sin proveedor',
);

const supplierBadgeColor = computed(() =>
  props.card.supplier_name?.trim() ? 'neutral' : 'error',
);

function onCardClick() {
  emit('select', props.card.id);
}
</script>

<template>
  <UCard
    class="cursor-pointer transition-shadow hover:shadow-md"
    :class="{ 'operational-rescue-card--critical': hasCriticalAlert }"
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
      <UBadge
        :color="supplierBadgeColor as 'neutral'"
        icon="i-lucide-truck"
        :label="supplierLabel"
        variant="subtle"
        size="sm"
        class="min-w-0 max-w-[60%] truncate"
      />
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

    <div
      v-if="isRescueUnlockActive(card.unlocked_until)"
      class="flex justify-start"
    >
      <RescueUnlockCountdown
        :unlocked-until="card.unlocked_until"
        compact
        :show-expired-hint="false"
      />
    </div>

    <div class="flex items-center justify-between gap-2 text-xs text-muted">
      <UTooltip :text="chatBadge.tooltip">
        <UBadge
          :color="chatBadge.color as 'neutral'"
          icon="i-lucide-message-square"
          :label="chatBadge.label"
          variant="subtle"
          size="sm"
        />
      </UTooltip>
      <UTooltip :text="slaBadge.tooltip">
        <UBadge
          :color="slaBadge.customStyle ? 'neutral' : (slaBadge.color as 'neutral')"
          icon="i-lucide-clock-alert"
          :label="slaBadge.label"
          :style="slaBadge.customStyle"
          :class="slaBadge.customStyle ? 'ring-0' : undefined"
          variant="subtle"
          size="sm"
        />
      </UTooltip>
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

    <LazyOperationalRescueCardQuickChat
      v-if="showQuickChat"
      hydrate-on-visible
      :rescue-id="card.id"
    />
  </UCard>
</template>

<style scoped>
@keyframes operational-rescue-card-critical-glow {
  0%,
  100% {
    box-shadow:
      0 0 0 1px rgb(239 68 68 / 0.55),
      0 0 8px rgb(239 68 68 / 0.25);
  }

  50% {
    box-shadow:
      0 0 0 2px rgb(239 68 68 / 0.95),
      0 0 14px rgb(239 68 68 / 0.55);
  }
}

.operational-rescue-card--critical {
  --tw-ring-color: transparent;
  animation: operational-rescue-card-critical-glow 1.25s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .operational-rescue-card--critical {
    animation: none;
    box-shadow: 0 0 0 2px rgb(239 68 68 / 0.85);
  }
}
</style>
