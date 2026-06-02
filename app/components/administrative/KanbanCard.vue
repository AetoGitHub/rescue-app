<script setup lang="ts">
import type { AdministrativeRescueCard } from '~/interfaces/rescue/administrative';

const props = defineProps<{
  card: AdministrativeRescueCard;
}>();

const emit = defineEmits<{
  select: [card: AdministrativeRescueCard];
}>();

const serviceTypeBadge = computed(() =>
  getRescueServiceTypeBadge(props.card.service_type),
);

const salePrice = computed(() => formatRescueCardMoney(props.card.sale_price));

const utilLabel = computed(() => {
  const formatted = formatRescueCardMoney(props.card.net_profit);
  return formatted === '—' ? 'Util: —' : `Util: ${formatted}`;
});

const hasUtil = computed(
  () =>
    props.card.net_profit != null
    && props.card.net_profit !== ''
    && formatRescueCardMoney(props.card.net_profit) !== '—',
);

const supplierLabel = computed(() =>
  props.card.supplier_name?.trim() ? props.card.supplier_name : 'Sin proveedor',
);

const supplierBadgeColor = computed(() =>
  props.card.supplier_name?.trim() ? 'neutral' : 'error',
);

function onCardClick() {
  emit('select', props.card);
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
        {{ card.folio }}
      </span>
      <UBadge
        :color="serviceTypeBadge.color as 'info'"
        variant="subtle"
        size="sm"
        class="shrink-0 uppercase tracking-wide"
      >
        <UIcon
          :name="serviceTypeBadge.icon"
          class="size-3.5"
        />
        {{ serviceTypeBadge.label }}
      </UBadge>
    </div>

    <p class="text-sm font-semibold text-highlighted leading-snug">
      {{ card.client_name }}
    </p>

    <div class="flex items-end justify-between gap-2">
      <UBadge
        :color="supplierBadgeColor as 'neutral'"
        icon="i-lucide-truck"
        :label="supplierLabel"
        variant="subtle"
        size="sm"
        class="min-w-0 max-w-[55%] truncate"
      />
      <div class="text-right shrink-0">
        <p class="text-sm font-semibold text-highlighted tabular-nums">
          {{ salePrice }}
        </p>
        <p
          class="text-xs tabular-nums"
          :class="hasUtil ? 'text-success font-medium' : 'text-muted'"
        >
          {{ utilLabel }}
        </p>
      </div>
    </div>
  </UCard>
</template>
