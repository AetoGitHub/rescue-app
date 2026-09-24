<script setup lang="ts">
/**
 * KPIs de los reportes del portal (Por Facturar / Por Cobrar). En desktop van
 * en una fila compacta junto al título; en móvil el destacado (`accent`) va
 * arriba a lo ancho y el resto en celdas compactas.
 */
export interface ClientPortalStat {
  key: string;
  label: string;
  value: string;
  /** Valor abreviado para las celdas angostas de móvil. */
  compactValue?: string;
  hint?: string;
  icon: string;
  accent?: boolean;
}

const props = defineProps<{
  stats: ClientPortalStat[];
  isLoading?: boolean;
}>();

const secondaryCount = computed(
  () => props.stats.filter(stat => !stat.accent).length,
);

/** En móvil el destacado ocupa su propia fila y el resto se reparte abajo. */
const MOBILE_COLUMNS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
};
</script>

<template>
  <div
    class="grid gap-2 sm:gap-3 lg:flex"
    :class="MOBILE_COLUMNS[secondaryCount] ?? 'grid-cols-2'"
  >
    <div
      v-for="stat in stats"
      :key="stat.key"
      class="flex min-w-0 items-center gap-3 rounded-xl border px-3 py-2.5 lg:flex-1 lg:py-2"
      :class="stat.accent
        ? 'order-first col-span-full border-primary/30 bg-primary/10 lg:order-none lg:flex-[1.35]'
        : 'border-default bg-default'"
    >
      <span
        class="size-8 shrink-0 items-center justify-center rounded-lg"
        :class="stat.accent
          ? 'flex bg-primary/15 text-primary lg:hidden 2xl:flex'
          : 'hidden bg-elevated text-muted 2xl:flex'"
      >
        <UIcon
          :name="stat.icon"
          class="size-4"
        />
      </span>

      <div class="flex min-w-0 flex-1 flex-col">
        <p class="truncate text-[11px] font-semibold uppercase tracking-wider text-muted">
          {{ stat.label }}
          <span
            v-if="stat.hint"
            class="hidden font-normal normal-case tracking-normal text-dimmed sm:inline"
          >· {{ stat.hint }}</span>
        </p>

        <USkeleton
          v-if="isLoading"
          class="my-1 h-6 w-20"
        />
        <p
          v-else
          class="truncate font-bold tabular-nums tracking-tight"
          :class="stat.accent
            ? 'text-2xl text-primary lg:text-xl'
            : 'text-base text-highlighted sm:text-lg'"
          :title="stat.value"
        >
          <template v-if="stat.compactValue && !stat.accent">
            <span class="sm:hidden">{{ stat.compactValue }}</span>
            <span class="hidden sm:inline">{{ stat.value }}</span>
          </template>
          <template v-else>
            {{ stat.value }}
          </template>
        </p>
      </div>
    </div>
  </div>
</template>
