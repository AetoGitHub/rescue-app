<script setup lang="ts">
import { useIntersectionObserver } from '@vueuse/core';
import type { AsyncStatus } from '@pinia/colada';
import type { PendingInvoiceRow } from '~/interfaces/invoicing/pending-invoice';
import type { PendingInvoiceEvidenceColumn } from '~/utils/pending-invoice-evidence';
import {
  daysSemaphoreColor,
  formatPendingInvoiceDate,
  formatPendingInvoiceMoney,
} from '~/utils/pending-invoice-display';
import { PENDING_INVOICE_ADMIN_DOC_COPY } from '~/constants/pending-invoice';

/**
 * Vista de Por Facturar en móvil: una tarjeta por evento en lugar de la
 * tabla de 17 columnas. Carga la siguiente página al llegar al final.
 */
const props = defineProps<{
  rows: PendingInvoiceRow[];
  downloadingEvidenceKey?: string | null;
  processingOcRowId?: number | null;
  hasNextPage?: boolean;
  loadNextPage?: () => unknown;
  asyncStatus?: AsyncStatus;
}>();

const emit = defineEmits<{
  comment: [row: PendingInvoiceRow];
  adminDoc: [row: PendingInvoiceRow];
  evidenceZip: [row: PendingInvoiceRow, column: PendingInvoiceEvidenceColumn];
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
  success: 'before:bg-success',
  warning: 'before:bg-warning',
  error: 'before:bg-error',
} as const;

const DAYS_BADGE_CLASS = {
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-error/10 text-error',
} as const;

function evidenceLoading(row: PendingInvoiceRow, column: PendingInvoiceEvidenceColumn) {
  return props.downloadingEvidenceKey === `${row.id}:${column}`;
}

function hasOcPdf(row: PendingInvoiceRow) {
  return Boolean(row.oc_pdf?.trim());
}
</script>

<template>
  <div class="flex flex-col gap-2.5">
    <p
      v-if="rows.length === 0"
      class="rounded-xl border border-dashed border-default px-4 py-10 text-center text-sm text-muted"
    >
      Ningún evento coincide con los filtros.
    </p>

    <article
      v-for="row in rows"
      :key="row.id"
      class="relative overflow-hidden rounded-xl border border-default bg-default p-3.5 ps-4 before:absolute before:inset-y-0 before:start-0 before:w-1"
      :class="ACCENT_CLASS[daysSemaphoreColor(row.dias)]"
    >
      <header class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="truncate font-semibold tabular-nums text-highlighted">
            {{ row.folio }}
          </p>
          <p class="truncate text-xs text-muted">
            {{ row.compania }}
            <span class="text-dimmed">·</span>
            Unidad {{ row.unidad || '—' }}
          </p>
        </div>

        <span
          class="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums"
          :class="DAYS_BADGE_CLASS[daysSemaphoreColor(row.dias)]"
        >
          {{ row.dias }} días
        </span>
      </header>

      <p class="mt-2 line-clamp-2 text-sm text-pretty text-default">
        {{ row.descripcion || 'Sin descripción' }}
      </p>

      <div class="mt-3 flex items-end justify-between gap-3">
        <div class="flex min-w-0 flex-col gap-1.5">
          <div class="flex flex-wrap items-center gap-1.5">
            <UBadge
              :color="row.status === 'En remisión' ? 'info' : 'neutral'"
              :variant="row.status === 'En remisión' ? 'subtle' : 'outline'"
              :icon="row.status === 'En remisión' ? 'i-lucide-file-check' : 'i-lucide-clock'"
              size="sm"
              class="rounded-full"
              :label="row.status"
            />
            <span
              v-if="row.oc"
              class="truncate text-xs text-muted"
            >
              OC {{ row.oc }}
            </span>
          </div>
          <p class="text-xs text-dimmed">
            {{ formatPendingInvoiceDate(row.fecha) }}
            <template v-if="row.responsable">
              · {{ row.responsable }}
            </template>
          </p>
        </div>

        <div class="shrink-0 text-right">
          <p class="text-base font-bold tabular-nums text-highlighted">
            {{ formatPendingInvoiceMoney(row.total) }}
          </p>
          <p class="text-[11px] tabular-nums text-dimmed">
            {{ formatPendingInvoiceMoney(row.subtotal) }} + IVA
          </p>
        </div>
      </div>

      <footer class="mt-3 flex items-center gap-1.5 border-t border-default pt-2.5">
        <UButton
          color="neutral"
          variant="soft"
          size="sm"
          icon="i-lucide-message-square"
          label="Chat"
          @click="emit('comment', row)"
        />
        <UButton
          v-if="hasOcPdf(row)"
          :to="row.oc_pdf!"
          target="_blank"
          color="neutral"
          variant="soft"
          size="sm"
          square
          icon="i-lucide-file-text"
          :aria-label="PENDING_INVOICE_ADMIN_DOC_COPY.ocPdfOpen"
        />
        <UButton
          color="neutral"
          variant="soft"
          size="sm"
          icon="i-lucide-upload"
          :label="hasOcPdf(row) ? undefined : 'OC'"
          :square="hasOcPdf(row)"
          :aria-label="hasOcPdf(row)
            ? PENDING_INVOICE_ADMIN_DOC_COPY.uploadReplace
            : 'Subir orden de compra'"
          :loading="processingOcRowId === row.id"
          :disabled="processingOcRowId === row.id"
          @click="emit('adminDoc', row)"
        />

        <div class="ms-auto flex items-center gap-1.5">
          <UButton
            v-if="row.evidencia_rescate"
            color="primary"
            variant="soft"
            size="sm"
            icon="i-lucide-archive"
            label="Rescate"
            aria-label="Descargar evidencia de rescate"
            :loading="evidenceLoading(row, 'evidencia_rescate')"
            :disabled="evidenceLoading(row, 'evidencia_rescate')"
            @click="emit('evidenceZip', row, 'evidencia_rescate')"
          />
          <UButton
            v-if="row.evidencia_pagos"
            color="primary"
            variant="soft"
            size="sm"
            icon="i-lucide-archive"
            label="Pagos"
            aria-label="Descargar evidencia de pagos"
            :loading="evidenceLoading(row, 'evidencia_pagos')"
            :disabled="evidenceLoading(row, 'evidencia_pagos')"
            @click="emit('evidenceZip', row, 'evidencia_pagos')"
          />
        </div>
      </footer>
    </article>

    <div
      ref="sentinel"
      class="h-px"
      aria-hidden="true"
    />
  </div>
</template>
