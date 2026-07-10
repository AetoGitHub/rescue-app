import type { MaybeRefOrGetter } from 'vue';
import { RESCUE_ADMINISTRATIVE_TOAST } from '~/constants/rescue-administrative-flow';
import type { AdministrativeRescueDetail,
  RescueAdministrativeActionId,
  RescueInvoiceFormState,
  RescueRemittanceFormState } from '~/interfaces/rescue/administrative';

import {
  rescueAdminCancelSchema,
  rescueAdminRevertCancelSchema,
  rescueAdministrativePaymentSchema,
  rescueInvoiceSchema,
  rescuePurchaseOrderSchema,
  rescueRemittanceSchema,
} from '~/schemas/rescue-administrative';
import { toAdministrativeUpdatePayload } from '~/utils/rescue-administrative-api-map';
import {
  generateInvoiceNumber,
  generateRemittanceNumber,
} from '~/utils/rescue-administrative-doc-numbers';
import {
  administrativeDetailToFlowContext,
  isAdminActionAllowed,
  isPurchaseOrderBlockingInvoice,
} from '~/utils/rescue-administrative-flow';
import { todayIsoDate } from '~/utils/rescue-operative-flow';

export function useRescueAdministrativeFlow(options: {
  rescueId: MaybeRefOrGetter<number | null>;
  detail: MaybeRefOrGetter<AdministrativeRescueDetail | null>;
  refresh: () => Promise<unknown>;
  onChanged?: () => void;
}) {
  const toast = useToast();
  const rescueId = computed(() => toValue(options.rescueId));
  const detail = computed(() => toValue(options.detail));

  const { updateAdministrative, revertAdministrativeCancellation, isUpdating } =
    useRescueAdministrativeMutation(rescueId);

  const remittanceModalOpen = ref(false);
  const invoiceModalOpen = ref(false);
  const invoiceSubmitAction = ref<'skip_to_invoiced' | 'register_invoice'>(
    'register_invoice',
  );
  const paymentModalOpen = ref(false);
  const cancelModalOpen = ref(false);
  const warrantyModalOpen = ref(false);
  const revertCancelModalOpen = ref(false);

  const remittanceForm = reactive<RescueRemittanceFormState>({
    remittance_number: generateRemittanceNumber(),
  });

  const invoiceForm = reactive<RescueInvoiceFormState>({
    invoice_number: generateInvoiceNumber(),
    invoice_date: todayIsoDate(),
    invoice_amount: '',
  });

  const paymentForm = reactive({
    payment_evidence_url: '',
  });

  const cancellationReasonId = ref<number | null>(null);
  const reacceptanceReasonId = ref<number | null>(null);
  const purchaseOrderNumber = ref('');

  const flowContext = computed(() => {
    const d = detail.value;
    if (!d) return null;
    return administrativeDetailToFlowContext(d);
  });

  watch(
    detail,
    (d) => {
      if (!d) return;
      purchaseOrderNumber.value = d.purchase_order_number ?? '';
      invoiceForm.invoice_amount = d.sale_price ?? d.invoice_amount ?? '';
    },
    { immediate: true },
  );

  function regenerateRemittanceNumber() {
    remittanceForm.remittance_number = generateRemittanceNumber();
  }

  function regenerateInvoiceNumber() {
    invoiceForm.invoice_number = generateInvoiceNumber();
  }

  function openInvoiceModal(action: 'skip_to_invoiced' | 'register_invoice') {
    const d = detail.value;
    invoiceSubmitAction.value = action;
    invoiceForm.invoice_number = d?.invoice_number ?? generateInvoiceNumber();
    invoiceForm.invoice_date = d?.invoice_date ?? todayIsoDate();
    invoiceForm.invoice_amount = d?.sale_price ?? d?.invoice_amount ?? '';
    invoiceModalOpen.value = true;
  }

  function openDocumentAction(_channel: 'pdf' | 'email' | 'whatsapp') {
    toast.add({
      title: RESCUE_ADMINISTRATIVE_TOAST.documentComingSoon,
      color: 'info',
    });
  }

  async function runUpdate(
    action: RescueAdministrativeActionId,
    forms?: Parameters<typeof toAdministrativeUpdatePayload>[1],
  ) {
    const body = toAdministrativeUpdatePayload(action, forms);
    await updateAdministrative(body);
    toast.add({
      title: RESCUE_ADMINISTRATIVE_TOAST.updated,
      color: 'success',
    });
    await options.refresh();
    options.onChanged?.();
  }

  function handleAction(action: RescueAdministrativeActionId) {
    const ctx = flowContext.value;
    if (!ctx) return;

    if (ctx.blocked) {
      toast.add({
        title: RESCUE_ADMINISTRATIVE_TOAST.rescueBlocked,
        color: 'error',
      });
      return;
    }

    if (!isAdminActionAllowed(ctx, action)) {
      return;
    }

    if (action === 'register_invoice' && isPurchaseOrderBlockingInvoice(ctx)) {
      toast.add({
        title: RESCUE_ADMINISTRATIVE_TOAST.purchaseOrderRequired,
        color: 'error',
      });
      return;
    }

    switch (action) {
      case 'issue_remittance':
        remittanceForm.remittance_number = generateRemittanceNumber();
        remittanceModalOpen.value = true;
        break;
      case 'skip_to_invoiced':
        openInvoiceModal('skip_to_invoiced');
        break;
      case 'register_invoice':
        openInvoiceModal('register_invoice');
        break;
      case 'apply_payment':
        paymentForm.payment_evidence_url = '';
        paymentModalOpen.value = true;
        break;
      case 'admin_cancel':
        cancellationReasonId.value = null;
        cancelModalOpen.value = true;
        break;
      case 'open_warranty':
        warrantyModalOpen.value = true;
        break;
      case 'revert_admin_cancellation':
        reacceptanceReasonId.value = null;
        revertCancelModalOpen.value = true;
        break;
      default:
        break;
    }
  }

  async function submitRemittance() {
    const parsed = rescueRemittanceSchema.safeParse(remittanceForm);
    if (!parsed.success) {
      toast.add({
        title: parsed.error.issues[0]?.message ?? 'Datos inválidos',
        color: 'error',
      });
      return;
    }
    await runUpdate('issue_remittance', { remittance: parsed.data });
    remittanceModalOpen.value = false;
  }

  async function submitInvoice(skipAction: 'skip_to_invoiced' | 'register_invoice') {
    const parsed = rescueInvoiceSchema.safeParse(invoiceForm);
    if (!parsed.success) {
      toast.add({
        title: parsed.error.issues[0]?.message ?? 'Datos inválidos',
        color: 'error',
      });
      return;
    }
    await runUpdate(skipAction, { invoice: parsed.data });
    invoiceModalOpen.value = false;
  }

  async function submitInvoiceFromModal() {
    await submitInvoice(invoiceSubmitAction.value);
  }

  async function submitPayment() {
    const parsed = rescueAdministrativePaymentSchema.safeParse(paymentForm);
    if (!parsed.success) {
      toast.add({
        title: parsed.error.issues[0]?.message ?? 'Datos inválidos',
        color: 'error',
      });
      return;
    }
    await runUpdate('apply_payment', { payment: parsed.data });
    paymentModalOpen.value = false;
  }

  async function submitAdminCancel() {
    const parsed = rescueAdminCancelSchema.safeParse({
      cancellation_reason_id: cancellationReasonId.value,
    });
    if (!parsed.success) {
      toast.add({
        title: parsed.error.issues[0]?.message ?? 'Selecciona un motivo',
        color: 'error',
      });
      return;
    }
    await runUpdate('admin_cancel', {
      cancellationReasonId: parsed.data.cancellation_reason_id,
    });
    cancelModalOpen.value = false;
  }

  async function submitOpenWarranty() {
    await runUpdate('open_warranty');
    warrantyModalOpen.value = false;
  }

  async function submitRevertAdminCancel() {
    const parsed = rescueAdminRevertCancelSchema.safeParse({
      reacceptance_reason_id: reacceptanceReasonId.value,
    });
    if (!parsed.success) {
      toast.add({
        title: parsed.error.issues[0]?.message ?? 'Selecciona un motivo',
        color: 'error',
      });
      return;
    }
    await revertAdministrativeCancellation({
      reacceptance_reason: parsed.data.reacceptance_reason_id,
    });
    toast.add({
      title: RESCUE_ADMINISTRATIVE_TOAST.updated,
      color: 'success',
    });
    await options.refresh();
    options.onChanged?.();
    revertCancelModalOpen.value = false;
  }

  async function submitPurchaseOrder() {
    if (flowContext.value?.blocked) {
      toast.add({
        title: RESCUE_ADMINISTRATIVE_TOAST.rescueBlocked,
        color: 'error',
      });
      return;
    }

    const parsed = rescuePurchaseOrderSchema.safeParse({
      purchase_order_number: purchaseOrderNumber.value,
    });
    if (!parsed.success) {
      toast.add({
        title: parsed.error.issues[0]?.message ?? 'Datos inválidos',
        color: 'error',
      });
      return;
    }
    await runUpdate('save_purchase_order', {
      purchaseOrderNumber: parsed.data.purchase_order_number,
    });
  }

  const purchaseOrderHighlight = computed(() => {
    const ctx = flowContext.value;
    if (!ctx) return false;
    return isPurchaseOrderBlockingInvoice(ctx);
  });

  return {
    remittanceModalOpen,
    invoiceModalOpen,
    invoiceSubmitAction,
    paymentModalOpen,
    cancelModalOpen,
    warrantyModalOpen,
    revertCancelModalOpen,
    remittanceForm,
    invoiceForm,
    paymentForm,
    cancellationReasonId,
    reacceptanceReasonId,
    purchaseOrderNumber,
    flowContext,
    handleAction,
    submitRemittance,
    submitInvoice,
    submitInvoiceFromModal,
    submitPayment,
    submitAdminCancel,
    submitOpenWarranty,
    submitRevertAdminCancel,
    submitPurchaseOrder,
    regenerateRemittanceNumber,
    regenerateInvoiceNumber,
    openDocumentAction,
    isUpdating,
    purchaseOrderHighlight,
  };
}
