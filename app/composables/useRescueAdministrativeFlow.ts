import type { MaybeRefOrGetter } from 'vue';
import { RESCUE_ADMINISTRATIVE_TOAST } from '~/constants/rescue-administrative-flow';
import type { AdministrativeRescueDetail } from '~/interfaces/rescue/administrative';
import type {
  RescueAdministrativeActionId,
  RescueAdministrativePaymentFormState,
  RescueInvoiceFormState,
  RescueRemittanceFormState,
} from '~/interfaces/rescue/administrative';
import {
  rescueAdminCancelSchema,
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

  const { updateAdministrative, isUpdating } =
    useRescueAdministrativeMutation(rescueId);

  const remittanceModalOpen = ref(false);
  const invoiceModalOpen = ref(false);
  const paymentModalOpen = ref(false);
  const cancelModalOpen = ref(false);
  const warrantyModalOpen = ref(false);

  const remittanceForm = reactive<RescueRemittanceFormState>({
    remittance_number: generateRemittanceNumber(),
  });

  const invoiceForm = reactive<RescueInvoiceFormState>({
    invoice_number: generateInvoiceNumber(),
    invoice_date: todayIsoDate(),
    invoice_amount: '',
  });

  const paymentForm = reactive<RescueAdministrativePaymentFormState>({
    payment_amount: '',
    payment_date: todayIsoDate(),
    payment_method: '',
    payment_reference: '',
  });

  const cancellationReasonId = ref<number | null>(null);
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
      paymentForm.payment_amount = d.sale_price ?? d.invoice_amount ?? '';
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
    // TODO: onBillingStatusChanged / onOperativeStatusChanged (commissions)
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
        void submitSkipToInvoiced();
        break;
      case 'register_invoice':
        invoiceForm.invoice_number =
          detail.value?.invoice_number ?? generateInvoiceNumber();
        invoiceForm.invoice_date =
          detail.value?.invoice_date ?? todayIsoDate();
        invoiceModalOpen.value = true;
        break;
      case 'apply_payment':
        paymentForm.payment_date = todayIsoDate();
        paymentModalOpen.value = true;
        break;
      case 'admin_cancel':
        cancellationReasonId.value = null;
        cancelModalOpen.value = true;
        break;
      case 'open_warranty':
        warrantyModalOpen.value = true;
        break;
      default:
        break;
    }
  }

  async function submitSkipToInvoiced() {
    const d = detail.value;
    const payload: RescueInvoiceFormState = {
      invoice_number: generateInvoiceNumber(),
      invoice_date: todayIsoDate(),
      invoice_amount: d?.sale_price ?? d?.invoice_amount ?? '0',
    };
    const parsed = rescueInvoiceSchema.safeParse(payload);
    if (!parsed.success) {
      toast.add({
        title: 'No hay monto de venta para facturar',
        color: 'error',
      });
      return;
    }
    await runUpdate('skip_to_invoiced', { invoice: parsed.data });
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

  async function submitPayment() {
    const parsed = rescueAdministrativePaymentSchema.safeParse(paymentForm);
    if (!parsed.success) {
      toast.add({
        title: parsed.error.issues[0]?.message ?? 'Datos inválidos',
        color: 'error',
      });
      return;
    }
    await runUpdate('apply_payment', {
      payment: {
        ...parsed.data,
        payment_reference: parsed.data.payment_reference ?? '',
      },
      closedAt: parsed.data.payment_date,
    });
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

  async function submitPurchaseOrder() {
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
    paymentModalOpen,
    cancelModalOpen,
    warrantyModalOpen,
    remittanceForm,
    invoiceForm,
    paymentForm,
    cancellationReasonId,
    purchaseOrderNumber,
    flowContext,
    handleAction,
    submitRemittance,
    submitInvoice,
    submitPayment,
    submitAdminCancel,
    submitOpenWarranty,
    submitPurchaseOrder,
    regenerateRemittanceNumber,
    regenerateInvoiceNumber,
    openDocumentAction,
    isUpdating,
    purchaseOrderHighlight,
  };
}
