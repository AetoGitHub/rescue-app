<script setup lang="ts">
import { PENDING_INVOICE_ZIP_COMING_SOON } from '~/constants/pending-invoice-api';
import type { PendingInvoiceSummary } from '~/interfaces/invoicing/pending-invoice';

const props = defineProps<{
  summary?: PendingInvoiceSummary | null;
  rowCount: number;
  hasNextPage?: boolean;
  hasActiveFilters?: boolean;
}>();

const toast = useToast();

const summaryLabel = computed(() => {
  if (props.hasActiveFilters) {
    const countLabel = props.hasNextPage
      ? `${props.rowCount}+ eventos`
      : `${props.rowCount} eventos`;
    return countLabel;
  }

  const eventos = props.summary?.eventos ?? props.rowCount;
  const total =
    props.summary != null
      ? formatRescueCardMoney(props.summary.total_con_iva)
      : '—';
  return `${eventos} eventos · ${total} c/IVA`;
});

function onDownloadZip() {
  toast.add({
    title: PENDING_INVOICE_ZIP_COMING_SOON,
    description: 'La descarga ZIP por compañía estará disponible pronto.',
    color: 'neutral',
  });
}
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-3">
    <p class="text-sm text-muted">
      {{ summaryLabel }}
    </p>
    <UButton
      color="primary"
      icon="i-lucide-download"
      label="Descargar ZIP por compañía"
      @click="onDownloadZip"
    />
  </div>
</template>
