<script setup lang="ts">
import type { SupplierServiceType } from '~/interfaces/catalogs/supplier';
import type { RescueSupplierNearbyRow, RescueSupplierSort } from '~/interfaces/rescue';
import { SUPPLIER_SERVICE_TYPE_OPTIONS } from '~/constants/catalog-select-options';
import { RESCUE_SUPPLIER_SORT_OPTIONS } from '~/constants/rescue-select-options';

const props = defineProps<{
  suppliers: RescueSupplierNearbyRow[];
  selectedId: number | null | undefined;
  loading?: boolean;
  distanceSortBlocked?: boolean;
  errorMessage?: string;
  emptyMessage?: string;
  distanceBlockedMessage?: string;
  showAddProviderLink?: boolean;
}>();

const emit = defineEmits<{
  select: [row: RescueSupplierNearbyRow];
  'toggle-add-provider': [];
}>();

const search = defineModel<string>('search', { default: '' });
const sort = defineModel<RescueSupplierSort>('sort', { required: true });
const serviceTypeFilter = defineModel<SupplierServiceType | 'all'>(
  'serviceTypeFilter',
  { default: 'all' },
);
const trustedOnly = defineModel<boolean>('trustedOnly', { default: false });

const serviceTypeFilterItems = [
  { label: 'Todos los tipos', value: 'all' as const },
  ...SUPPLIER_SERVICE_TYPE_OPTIONS,
];

const trusted = computed(
  () => partitionSuppliersByTrust(props.suppliers).trusted,
);
const others = computed(
  () => partitionSuppliersByTrust(props.suppliers).others,
);

const sortPillIcon: Record<RescueSupplierSort, string | undefined> = {
  distance: undefined,
  ranking: 'i-lucide-star',
  name: 'i-lucide-case-sensitive',
};

function formatDistance(km: number | null) {
  if (km == null || !Number.isFinite(km)) return '—';
  return `${Math.round(km)} km`;
}

function formatRanking(value: number) {
  if (!Number.isFinite(value) || value <= 0) return '—';
  return value.toFixed(1);
}

function primaryServiceLabel(row: RescueSupplierNearbyRow): string | null {
  const first = row.service_type[0];
  if (!first) return null;
  return formatSupplierServiceTypeLabel(first).toLowerCase();
}

function cardClasses(row: RescueSupplierNearbyRow, trustedSection: boolean) {
  const selected = props.selectedId === row.id;
  return [
    'flex w-full min-w-0 max-w-full flex-col gap-2 overflow-hidden rounded-lg px-4 py-3 text-left transition-colors',
    trustedSection
      ? 'border border-warning/30 border-l-4 border-l-warning bg-warning/5'
      : 'border border-default bg-default',
    selected
      ? 'ring-2 ring-primary/40 bg-primary/5'
      : 'hover:bg-elevated',
  ];
}

function onSortPill(value: RescueSupplierSort) {
  sort.value = value;
}

function toggleTrustedOnly() {
  trustedOnly.value = !trustedOnly.value;
}
</script>

<template>
  <div class="flex h-full min-h-0 min-w-0 flex-col gap-3 overflow-hidden">
    <div class="space-y-1">
      <h3 class="text-sm font-semibold text-highlighted">
        Asignar proveedor
      </h3>
      <p class="text-xs text-muted">
        Selecciona quién atenderá este servicio.
      </p>
    </div>

    <UInput
      v-model="search"
      leading-icon="i-lucide-search"
      placeholder="Buscar proveedor..."
      class="w-full"
      variant="subtle"
    />

    <div class="flex flex-wrap gap-2">
      <UButton
        v-for="option in RESCUE_SUPPLIER_SORT_OPTIONS"
        :key="option.value"
        size="sm"
        :color="sort === option.value ? 'primary' : 'neutral'"
        :variant="sort === option.value ? 'solid' : 'subtle'"
        :icon="sortPillIcon[option.value]"
        :label="option.label"
        @click="onSortPill(option.value)"
      />
      <UButton
        size="sm"
        :color="trustedOnly ? 'warning' : 'neutral'"
        :variant="trustedOnly ? 'solid' : 'subtle'"
        icon="i-lucide-star"
        label="Solo confianza"
        @click="toggleTrustedOnly"
      />
    </div>

    <USelectMenu
      v-model="serviceTypeFilter"
      :items="serviceTypeFilterItems"
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
      {{ distanceBlockedMessage }}
    </p>

    <div
      class="min-h-0 min-w-0 flex-1 space-y-4 overflow-x-hidden overflow-y-auto rounded-lg border border-default p-1"
    >
      <div
        v-if="loading"
        class="flex items-center justify-center py-12"
      >
        <UIcon
          name="i-lucide-loader-circle"
          class="size-8 animate-spin text-muted"
        />
      </div>

      <p
        v-else-if="distanceSortBlocked"
        class="px-2 py-8 text-center text-sm text-muted"
      >
        {{ distanceBlockedMessage }}
      </p>

      <p
        v-else-if="suppliers.length === 0"
        class="px-2 py-8 text-center text-sm text-muted"
      >
        {{ emptyMessage }}
      </p>

      <template v-else>
        <section v-if="trusted.length > 0" class="space-y-2">
          <h4
            class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-warning"
          >
            <UIcon name="i-lucide-star" class="size-3.5 shrink-0" />
            Confianza
          </h4>
          <ul class="space-y-2">
            <li v-for="row in trusted" :key="row.id">
              <button
                type="button"
                :class="cardClasses(row, true)"
                @click="emit('select', row)"
              >
                <div class="flex min-w-0 items-start justify-between gap-2">
                  <span
                    class="min-w-0 break-all font-medium"
                    :title="row.name"
                  >{{ row.name }}</span>
                  <UBadge
                    color="warning"
                    variant="subtle"
                    size="sm"
                    class="shrink-0 uppercase"
                  >
                    Confianza
                  </UBadge>
                </div>
                <div class="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                  <UBadge
                    v-if="primaryServiceLabel(row)"
                    color="neutral"
                    variant="subtle"
                    size="sm"
                    class="max-w-full normal-case"
                    :label="primaryServiceLabel(row)!"
                  />
                  <span class="inline-flex min-w-0 items-center gap-1 break-all">
                    <UIcon name="i-lucide-star" class="size-3.5 shrink-0 text-warning" />
                    {{ formatRanking(row.score) }}
                  </span>
                  <span class="inline-flex min-w-0 items-center gap-1 break-all">
                    <UIcon name="i-lucide-phone" class="size-3.5 shrink-0" />
                    {{ row.phone || '—' }}
                  </span>
                  <span class="inline-flex min-w-0 items-center gap-1">
                    <UIcon name="i-lucide-map-pin" class="size-3.5 shrink-0" />
                    {{ formatDistance(row.distance_km) }}
                  </span>
                </div>
              </button>
            </li>
          </ul>
        </section>

        <section v-if="others.length > 0" class="space-y-2">
          <h4 class="text-xs font-semibold uppercase tracking-wider text-muted">
            Todos los proveedores
          </h4>
          <ul class="space-y-2">
            <li v-for="row in others" :key="row.id">
              <button
                type="button"
                :class="cardClasses(row, false)"
                @click="emit('select', row)"
              >
                <span
                  class="min-w-0 break-all font-medium"
                  :title="row.name"
                >{{ row.name }}</span>
                <div class="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                  <UBadge
                    v-if="primaryServiceLabel(row)"
                    color="neutral"
                    variant="subtle"
                    size="sm"
                    class="max-w-full normal-case"
                    :label="primaryServiceLabel(row)!"
                  />
                  <span class="inline-flex min-w-0 items-center gap-1 break-all">
                    <UIcon name="i-lucide-star" class="size-3.5 shrink-0" />
                    {{ formatRanking(row.score) }}
                  </span>
                  <span class="inline-flex min-w-0 items-center gap-1 break-all">
                    <UIcon name="i-lucide-phone" class="size-3.5 shrink-0" />
                    {{ row.phone || '—' }}
                  </span>
                  <span class="inline-flex min-w-0 items-center gap-1">
                    <UIcon name="i-lucide-map-pin" class="size-3.5 shrink-0" />
                    {{ formatDistance(row.distance_km) }}
                  </span>
                </div>
              </button>
            </li>
          </ul>
        </section>
      </template>

      <button
        v-if="showAddProviderLink && !loading"
        type="button"
        class="flex w-full items-center justify-center gap-1 py-2 text-sm font-medium text-primary hover:underline"
        @click="emit('toggle-add-provider')"
      >
        <UIcon name="i-lucide-plus" class="size-4 shrink-0" />
        Agregar proveedor no registrado
      </button>

      <slot name="add-provider" />
    </div>
  </div>
</template>
