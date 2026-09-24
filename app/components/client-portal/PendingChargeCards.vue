<script setup lang="ts">
import { useIntersectionObserver } from '@vueuse/core';
import type { AsyncStatus } from '@pinia/colada';
import type { PendingChargeRow } from '~/interfaces/invoicing/pending-charge';
import { PENDING_CHARGE_STATUS_LABELS } from '~/constants/pending-charge';

/**
 * Vista de Por Cobrar en móvil: una tarjeta por factura. Carga la siguiente
 * página al llegar al final.
 */
const props = defineProps<{
  rows: PendingChargeRow[];
  hasNextPage?: boolean;
  loadNextPage?: () => unknown;
  asyncStatus?: AsyncStatus;
}>();

const sentinel = useTemplateRef<HTMLElement>('sentinel');
const isFetchingNextPage = ref(false);

function loadMore() {
  const canLoad = canLoadNextCursorPage({
    hasNextPage: props.hasNextPage ?? false,
    isFetchingNextPage: isFetchingNextPage.value,
    isPending: props.asyncStatus === 'loading',
  });
  if (!canLoad) return;
  isFetchingNextPage.value = true;
  void Promise.resolve(props.loadNextPage?.()).finally(() => {
    isFetchingNextPage.value = false;
  });
}

useIntersectionObserver(
  sentinel,
  ([entry]) => {
    if (entry?.isIntersecting) loadMore();
  },
  { rootMargin: '400px 0px' },
);

// Si la página quedó corta (filtros locales), sigue pidiendo mientras el
// sentinel siga visible.
watch(
  () => [props.rows.length, props.asyncStatus] as const,
  () => {
    const el = sentinel.value;
    if (!el) return;
    if (el.getBoundingClientRect().top < window.innerHeight + 400) loadMore();
  },
  { flush: 'post' },
);

const ACCENT_CLASS = {
  error: 'before:bg-error',
  warning: 'before:bg-warning',
  success: 'before:bg-success',
  neutral: 'before:bg-neutral-400 dark:before:bg-neutral-600',
} as const;

const DAYS_BADGE_CLASS = {
  error: 'bg-error/10 text-error',
  warning: 'bg-warning/10 text-warning',
  success: 'bg-success/10 text-success',
  neutral: 'bg-elevated text-muted',
} as const;

function daysLabel(row: PendingChargeRow): string | null {
  if (row.status === 'sin_credito') return null;
  if (row.dias_vencidos > 0) return `${row.dias_vencidos} días`;
  return 'Sin atraso';
}
</script>

<template>
  <div class="flex flex-col gap-2.5">
    <p
      v-if="rows.length === 0"
      class="rounded-xl border border-dashed border-default px-4 py-10 text-center text-sm text-muted"
    >
      Ninguna factura coincide con los filtros.
    </p>

    <article
      v-for="row in rows"
      :key="row.id"
      class="relative overflow-hidden rounded-xl border border-default bg-default p-3.5 ps-4 before:absolute before:inset-y-0 before:start-0 before:w-1"
      :class="ACCENT_CLASS[pendingChargeStatusColor(row.status)]"
    >
      <header class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="truncate font-semibold tabular-nums text-highlighted">
            {{ row.folio }}
          </p>
          <p class="truncate text-xs text-muted">
            {{ row.cliente }}
            <template v-if="row.compania && row.compania !== row.cliente">
              <span class="text-dimmed">·</span>
              {{ row.compania }}
            </template>
          </p>
        </div>

        <UBadge
          :color="pendingChargeStatusColor(row.status)"
          variant="subtle"
          size="sm"
          class="shrink-0 rounded-full"
          :label="PENDING_CHARGE_STATUS_LABELS[row.status]"
        />
      </header>

      <dl class="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        <div class="min-w-0">
          <dt class="text-dimmed">
            Vencimiento
          </dt>
          <dd class="truncate font-medium tabular-nums text-highlighted">
            {{ formatPendingInvoiceDate(row.vencimiento) }}
          </dd>
        </div>
        <div class="min-w-0">
          <dt class="text-dimmed">
            Atraso
          </dt>
          <dd>
            <span
              class="inline-block rounded-full px-1.5 font-semibold tabular-nums"
              :class="DAYS_BADGE_CLASS[pendingChargeDaysColor(row.status, row.dias_vencidos)]"
            >
              {{ daysLabel(row) ?? '—' }}
            </span>
          </dd>
        </div>
        <div class="min-w-0">
          <dt class="text-dimmed">
            Fecha factura
          </dt>
          <dd class="truncate tabular-nums text-default">
            {{ formatPendingInvoiceDate(row.fecha_factura) }}
          </dd>
        </div>
        <div class="min-w-0">
          <dt class="text-dimmed">
            RFC
          </dt>
          <dd class="truncate font-mono text-default">
            {{ row.rfc || '—' }}
          </dd>
        </div>
        <div class="col-span-2 min-w-0">
          <dt class="text-dimmed">
            Responsable
          </dt>
          <dd class="truncate text-default">
            {{ row.responsable || '—' }}
          </dd>
        </div>
      </dl>
    </article>

    <div
      ref="sentinel"
      class="h-px"
      aria-hidden="true"
    />
  </div>
</template>
