<script setup lang="ts">
import type { DashboardBillingSummary } from '~/interfaces/invoicing/dashboard-summary';

/**
 * Resumen de Por Facturar con los totales del endpoint `summary` (ya
 * respetan cliente y fechas), no de las filas cargadas en pantalla.
 * En móvil el total va arriba a lo ancho y el resto en tres celdas compactas.
 */
const props = defineProps<{
  summary: DashboardBillingSummary;
  isLoading?: boolean;
}>();

interface StatCard {
  key: string;
  label: string;
  value: string;
  /** Valor abreviado para las celdas angostas de móvil. */
  compactValue: string;
  hint: string;
  icon: string;
  accent?: boolean;
}

const stats = computed<StatCard[]>(() => {
  const { count, sub_total: subTotal, total } = props.summary;
  const iva = Math.max(total - subTotal, 0);
  const countLabel = count.toLocaleString('es-MX');

  return [
    {
      key: 'count',
      label: 'Eventos',
      value: countLabel,
      compactValue: countLabel,
      hint: 'pendientes',
      icon: 'i-lucide-truck',
    },
    {
      key: 'subtotal',
      label: 'Subtotal',
      value: formatPendingInvoiceMoney(subTotal),
      compactValue: formatPendingInvoiceMoneyCompact(subTotal),
      hint: 'sin IVA',
      icon: 'i-lucide-receipt-text',
    },
    {
      key: 'iva',
      label: 'IVA',
      value: formatPendingInvoiceMoney(iva),
      compactValue: formatPendingInvoiceMoneyCompact(iva),
      hint: 'trasladado',
      icon: 'i-lucide-percent',
    },
    {
      key: 'total',
      label: 'Total por facturar',
      value: formatPendingInvoiceMoney(total),
      compactValue: formatPendingInvoiceMoney(total),
      hint: 'con IVA',
      icon: 'i-lucide-wallet',
      accent: true,
    },
  ];
});
</script>

<template>
  <div class="grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-4">
    <div
      v-for="stat in stats"
      :key="stat.key"
      class="flex min-w-0 items-center gap-3 rounded-xl border px-3 py-2.5 sm:px-4 sm:py-3"
      :class="stat.accent
        ? 'order-first col-span-3 border-primary/30 bg-primary/10 lg:order-none lg:col-span-1'
        : 'border-default bg-default'"
    >
      <span
        class="size-9 shrink-0 items-center justify-center rounded-lg"
        :class="stat.accent
          ? 'flex bg-primary/15 text-primary'
          : 'hidden bg-elevated text-muted sm:flex'"
      >
        <UIcon
          :name="stat.icon"
          class="size-4.5"
        />
      </span>

      <div class="flex min-w-0 flex-1 flex-col">
        <p class="truncate text-[11px] font-semibold uppercase tracking-wider text-muted">
          {{ stat.label }}
        </p>

        <USkeleton
          v-if="isLoading"
          class="my-1 h-6 w-20"
        />
        <p
          v-else
          class="truncate font-bold tabular-nums tracking-tight"
          :class="stat.accent
            ? 'text-2xl text-primary'
            : 'text-base text-highlighted sm:text-xl'"
          :title="stat.value"
        >
          <span :class="stat.accent ? undefined : 'sm:hidden'">{{ stat.compactValue }}</span>
          <span
            v-if="!stat.accent"
            class="hidden sm:inline"
          >{{ stat.value }}</span>
        </p>
      </div>

      <p
        class="hidden shrink-0 self-end text-xs text-dimmed"
        :class="stat.accent ? 'max-lg:block' : 'xl:block'"
      >
        {{ stat.hint }}
      </p>
    </div>
  </div>
</template>
