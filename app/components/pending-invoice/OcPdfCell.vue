<script setup lang="ts">
import type { PendingInvoiceRow } from '~/interfaces/invoicing/pending-invoice';
import { PENDING_INVOICE_ADMIN_DOC_COPY } from '~/constants/pending-invoice';

const props = defineProps<{
  row: PendingInvoiceRow;
}>();

const emit = defineEmits<{
  upload: [];
}>();

const hasPdf = computed(() => Boolean(props.row.oc_pdf?.trim()));
</script>

<template>
  <div class="flex items-center justify-center gap-0.5">
    <UButton
      v-if="hasPdf"
      :to="row.oc_pdf!"
      target="_blank"
      color="neutral"
      variant="ghost"
      size="xs"
      square
      icon="i-lucide-file-text"
      :aria-label="PENDING_INVOICE_ADMIN_DOC_COPY.ocPdfOpen"
    />

    <UButton
      color="neutral"
      variant="ghost"
      size="xs"
      icon="i-lucide-upload"
      :label="hasPdf ? undefined : PENDING_INVOICE_ADMIN_DOC_COPY.upload"
      :square="hasPdf"
      :aria-label="hasPdf
        ? PENDING_INVOICE_ADMIN_DOC_COPY.uploadReplace
        : PENDING_INVOICE_ADMIN_DOC_COPY.upload"
      @click="emit('upload')"
    />
  </div>
</template>
