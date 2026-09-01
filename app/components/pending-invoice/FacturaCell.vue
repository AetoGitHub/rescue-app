<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui';
import type { PendingInvoiceRow } from '~/interfaces/invoicing/pending-invoice';
import { PENDING_INVOICE_ADMIN_DOC_COPY } from '~/constants/pending-invoice';
import {
  parsePendingInvoiceAdminDoc,
  pendingInvoiceAdminDocToBody,
  pendingInvoiceFacturaSchema,
  type PendingInvoiceFacturaFormState,
} from '~/schemas/pending-invoice';

const props = defineProps<{
  row: PendingInvoiceRow;
}>();

const { save, isSaving } = useRescueAdminDoc(() => props.row.id);
const { onFormError } = useFormValidationFeedback();
const toast = useToast();
const formRef = useTemplateRef<{ submit: () => Promise<void> }>('formRef');

const state = reactive<PendingInvoiceFacturaFormState>({
  invoice_folio: props.row.factura ?? '',
});

watch(
  () => props.row.factura,
  (value) => {
    state.invoice_folio = value ?? '';
  },
);

function currentFolio() {
  return (props.row.factura ?? '').trim();
}

function isUnchanged() {
  return state.invoice_folio.trim() === currentFolio();
}

async function persistFactura(invoiceFolio: string) {
  if (isSaving.value) return;

  const parsed = parsePendingInvoiceAdminDoc({
    invoice_folio: invoiceFolio,
    oc_pdf: props.row.oc_pdf,
  });
  if (!parsed.success) {
    toast.add({
      title:
        parsed.error.issues[0]?.message
        ?? PENDING_INVOICE_ADMIN_DOC_COPY.facturaError,
      color: 'error',
    });
    return;
  }

  const ok = await save(pendingInvoiceAdminDocToBody(parsed.data), {
    silent: true,
  });
  if (ok) {
    toast.add({
      title: PENDING_INVOICE_ADMIN_DOC_COPY.facturaSuccess,
      color: 'success',
    });
  }
}

async function onSubmit(
  event: FormSubmitEvent<PendingInvoiceFacturaFormState>,
) {
  if (isUnchanged()) return;
  await persistFactura(event.data.invoice_folio);
}

function onBlur() {
  if (isUnchanged() || isSaving.value) return;
  void formRef.value?.submit();
}
</script>

<template>
  <UForm
    ref="formRef"
    :schema="pendingInvoiceFacturaSchema"
    :state="state"
    class="min-w-0"
    @submit="onSubmit"
    @error="onFormError"
  >
    <UFormField
      name="invoice_folio"
      :ui="{ error: 'sr-only' }"
    >
      <UInput
        v-model="state.invoice_folio"
        size="xs"
        variant="ghost"
        color="neutral"
        class="w-full min-w-24"
        :placeholder="PENDING_INVOICE_ADMIN_DOC_COPY.facturaPlaceholder"
        :disabled="isSaving"
        :loading="isSaving"
        :aria-label="PENDING_INVOICE_ADMIN_DOC_COPY.facturaLabel"
        @blur="onBlur"
      />
    </UFormField>
  </UForm>
</template>
