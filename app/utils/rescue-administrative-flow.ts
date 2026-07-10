import type { StepperItem } from '@nuxt/ui';
import {
  ADMIN_BILLING_FLOWS,
  ADMINISTRATIVE_LINEAR_STEPS,
  type AdminClientType,
  normalizeClientBillingType,
  RESCUE_ADMINISTRATIVE_BUTTON_LABELS,
  RESCUE_ADMINISTRATIVE_MANUAL_BILLING_ALERT,
  RESCUE_ADMINISTRATIVE_REMISSION_REQUIRED_ALERT,
} from '~/constants/rescue-administrative-flow';
import type { AdministrativeBillingStatus } from '~/constants/administrative-kanban';
import { getBillingStatusLabel } from '~/utils/administrative-rescue-display';
import { targetBillingStatusForAction } from '~/utils/rescue-administrative-api-map';
import type { AdministrativeRescueDetail,
  AdministrativeRescueCard,
  RescueAdministrativeActionId,
  RescueAdministrativeFlowContext,
  RescueAdministrativeFooterAction } from '~/interfaces/rescue/administrative';

const KANBAN_DOC_EDITABLE_STATUSES = new Set<AdministrativeBillingStatus>([
  'unattended',
  'in_remittance',
  'invoiced',
]);

const KANBAN_DOC_TERMINAL_STATUSES = new Set<AdministrativeBillingStatus>([
  'paid',
  'warranty',
  'canceled',
]);

const PURCHASE_ORDER_EDITABLE_STATUSES = new Set<AdministrativeBillingStatus>([
  'in_remittance',
  'invoiced',
]);

const PURCHASE_ORDER_READONLY_STATUSES = new Set<AdministrativeBillingStatus>([
  'in_remittance',
  'invoiced',
  'paid',
  'warranty',
  'canceled',
]);

const INVOICE_READONLY_STATUSES = new Set<AdministrativeBillingStatus>([
  'invoiced',
  'paid',
  'warranty',
  'canceled',
]);

function trimKanbanFolio(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function getKanbanRemittanceFolio(
  card: AdministrativeRescueCard,
): string | null {
  return trimKanbanFolio(card.remittance_folio);
}

export function getKanbanInvoiceFolio(
  card: AdministrativeRescueCard,
): string | null {
  return trimKanbanFolio(card.invoice_folio);
}

export function isKanbanRemittanceFolioEditable(
  card: AdministrativeRescueCard,
): boolean {
  if (card.blocked) return false;
  if (!KANBAN_DOC_EDITABLE_STATUSES.has(card.billing_status)) return false;
  return getKanbanRemittanceFolio(card) == null;
}

export function isKanbanInvoiceFolioEditable(
  card: AdministrativeRescueCard,
): boolean {
  if (card.blocked) return false;
  if (!KANBAN_DOC_EDITABLE_STATUSES.has(card.billing_status)) return false;
  return getKanbanInvoiceFolio(card) == null;
}

export function shouldShowKanbanRemittanceReadOnly(
  card: AdministrativeRescueCard,
): boolean {
  const remittance = getKanbanRemittanceFolio(card);
  if (!remittance) return false;
  return !isKanbanRemittanceFolioEditable(card);
}

export function shouldShowKanbanInvoiceReadOnly(
  card: AdministrativeRescueCard,
): boolean {
  const invoice = getKanbanInvoiceFolio(card);
  if (!invoice) return false;
  return !isKanbanInvoiceFolioEditable(card);
}

export function isKanbanAdminDocInputVisible(
  card: AdministrativeRescueCard,
): boolean {
  return (
    isKanbanRemittanceFolioEditable(card)
    || isKanbanInvoiceFolioEditable(card)
  );
}

export function isKanbanAdminDocReadOnlyVisible(
  card: AdministrativeRescueCard,
): boolean {
  return (
    shouldShowKanbanRemittanceReadOnly(card)
    || shouldShowKanbanInvoiceReadOnly(card)
  );
}

export function isKanbanAdminDocSectionVisible(
  card: AdministrativeRescueCard,
): boolean {
  return (
    isKanbanAdminDocInputVisible(card)
    || isKanbanAdminDocReadOnlyVisible(card)
  );
}

export function isKanbanAdminDocTerminalStatus(
  billingStatus: AdministrativeBillingStatus,
): boolean {
  return KANBAN_DOC_TERMINAL_STATUSES.has(billingStatus);
}


export function administrativeDetailToFlowContext(
  detail: AdministrativeRescueDetail,
): RescueAdministrativeFlowContext {
  return {
    billing_status: detail.billing_status,
    operative_status: detail.operative_status,
    client_type: detail.client_type,
    client_billing_type: detail.client_billing_type,
    requires_remision: detail.requires_remision,
    requires_purchase_order: detail.requires_purchase_order,
    purchase_order_number: detail.purchase_order_number,
    remittance_number: detail.remittance_number,
    invoice_number: detail.invoice_number,
    blocked: detail.blocked,
  };
}

const NON_LINEAR_BILLING_STATUSES = new Set<AdministrativeBillingStatus>([
  'warranty',
  'canceled',
  'invalid',
]);

export function isAdministrativeLinearStepperVisible(
  billingStatus: AdministrativeBillingStatus,
): boolean {
  return !NON_LINEAR_BILLING_STATUSES.has(billingStatus);
}

export function getAdministrativeStepperCurrentIndex(
  steps: AdministrativeBillingStatus[],
  billingStatus: AdministrativeBillingStatus,
): number {
  const index = steps.indexOf(billingStatus);
  return index >= 0 ? index : 0;
}

export function normalizeAdminClientType(clientType: string): AdminClientType {
  const upper = clientType.trim().toUpperCase();
  if (upper === 'CREDIT' || upper === 'CASH' || upper === 'PUBLIC') {
    return upper;
  }
  return 'CASH';
}

function applyPublicClientTransitionOverrides(
  clientType: AdminClientType,
  billingStatus: AdministrativeBillingStatus,
  transitions: AdministrativeBillingStatus[],
): AdministrativeBillingStatus[] {
  if (clientType !== 'PUBLIC') {
    return transitions;
  }

  if (billingStatus === 'paid') {
    return [];
  }

  return transitions.filter((target) => target !== 'warranty');
}

export function getAdministrativeStepperSteps(
  ctx: RescueAdministrativeFlowContext,
): AdministrativeBillingStatus[] {
  const billingType = normalizeClientBillingType(ctx.client_billing_type);
  return ADMINISTRATIVE_LINEAR_STEPS[billingType];
}

export function getValidAdminBillingTransitions(
  clientBillingType: string,
  billingStatus: AdministrativeBillingStatus,
  clientType = 'CASH',
): AdministrativeBillingStatus[] {
  const billing = normalizeClientBillingType(clientBillingType);
  const base = ADMIN_BILLING_FLOWS[billing][billingStatus] ?? [];
  return applyPublicClientTransitionOverrides(
    normalizeAdminClientType(clientType),
    billingStatus,
    base,
  );
}

function getValidTransitionsForContext(
  ctx: RescueAdministrativeFlowContext,
): AdministrativeBillingStatus[] {
  return getValidAdminBillingTransitions(
    ctx.client_billing_type,
    ctx.billing_status,
    ctx.client_type,
  );
}

export function getAdministrativeRemissionAlert(
  ctx: RescueAdministrativeFlowContext,
): { title: string; description: string } | null {
  if (ctx.billing_status !== 'unattended') {
    return null;
  }

  const billingType = normalizeClientBillingType(ctx.client_billing_type);
  if (billingType === 'MANUAL') {
    return {
      title: RESCUE_ADMINISTRATIVE_MANUAL_BILLING_ALERT.title,
      description: RESCUE_ADMINISTRATIVE_MANUAL_BILLING_ALERT.description,
    };
  }

  if (billingType === 'REMISSION') {
    return {
      title: RESCUE_ADMINISTRATIVE_REMISSION_REQUIRED_ALERT.title,
      description: RESCUE_ADMINISTRATIVE_REMISSION_REQUIRED_ALERT.description,
    };
  }

  return null;
}

export function isRescueAdministrativeBlocked(
  ctx: RescueAdministrativeFlowContext,
): boolean {
  return ctx.blocked;
}

export function isAdministrativePurchaseOrderEditable(
  ctx: RescueAdministrativeFlowContext,
): boolean {
  if (ctx.blocked) return false;
  if (!ctx.requires_purchase_order) return false;
  if (!PURCHASE_ORDER_EDITABLE_STATUSES.has(ctx.billing_status)) return false;
  return !ctx.purchase_order_number?.trim();
}

export function shouldShowAdministrativePurchaseOrderReadOnly(
  ctx: RescueAdministrativeFlowContext,
): boolean {
  if (!ctx.requires_purchase_order) return false;
  if (!ctx.purchase_order_number?.trim()) return false;
  return PURCHASE_ORDER_READONLY_STATUSES.has(ctx.billing_status);
}

export function shouldShowAdministrativeInvoiceReadOnly(
  detail: AdministrativeRescueDetail,
): boolean {
  if (!detail.invoice_number?.trim()) return false;
  return INVOICE_READONLY_STATUSES.has(detail.billing_status);
}

export function isAdminActionAllowed(
  ctx: RescueAdministrativeFlowContext,
  actionId: RescueAdministrativeActionId,
): boolean {
  if (ctx.blocked) {
    return false;
  }

  if (actionId === 'save_purchase_order') {
    return isAdministrativePurchaseOrderEditable(ctx);
  }

  if (actionId === 'revert_admin_cancellation') {
    return ctx.billing_status === 'canceled';
  }

  const transitions = getValidTransitionsForContext(ctx);

  if (actionId === 'issue_remittance') {
    return (
      ctx.billing_status === 'unattended'
      && transitions.includes('in_remittance')
    );
  }

  if (actionId === 'skip_to_invoiced') {
    return (
      ctx.billing_status === 'unattended'
      && transitions.includes('invoiced')
    );
  }

  const target = targetBillingStatusForAction(actionId);
  if (!target) {
    return false;
  }

  return transitions.includes(target);
}

const ADMINISTRATIVE_STEPPER_ICONS: Partial<
  Record<AdministrativeBillingStatus, string>
> = {
  unattended: 'i-lucide-inbox',
  in_remittance: 'i-lucide-file-text',
  invoiced: 'i-lucide-receipt',
  paid: 'i-lucide-circle-check',
};

export function getAdministrativeStepperItems(
  steps: AdministrativeBillingStatus[],
): StepperItem[] {
  return steps.map((status, index) => ({
    title: getBillingStatusLabel(status),
    icon: ADMINISTRATIVE_STEPPER_ICONS[status],
    value: index,
  }));
}

export function isPurchaseOrderBlockingInvoice(
  ctx: RescueAdministrativeFlowContext,
): boolean {
  return (
    ctx.billing_status === 'in_remittance'
    && ctx.requires_purchase_order
    && !ctx.purchase_order_number?.trim()
  );
}

export function showOperativeWarningBanner(
  ctx: RescueAdministrativeFlowContext,
): boolean {
  return ctx.billing_status === 'unattended' && ctx.operative_status !== 'closed';
}

export function getAdministrativeFooterFlowLabel(
  ctx: RescueAdministrativeFlowContext,
): string {
  return getBillingStatusLabel(ctx.billing_status);
}

export function getAdministrativeFooterActions(
  ctx: RescueAdministrativeFlowContext,
): RescueAdministrativeFooterAction[] {
  if (ctx.blocked) {
    return [];
  }

  const ocBlocked = isPurchaseOrderBlockingInvoice(ctx);
  const actions: RescueAdministrativeFooterAction[] = [];
  const unattendedTransitions =
    ctx.billing_status === 'unattended'
      ? getValidTransitionsForContext(ctx)
      : [];

  const candidates: Array<{
    id: RescueAdministrativeActionId;
    primary?: boolean;
    color?: RescueAdministrativeFooterAction['color'];
    disabled?: boolean;
  }> = [];

  if (ctx.billing_status === 'unattended') {
    if (unattendedTransitions.includes('in_remittance')) {
      candidates.push({ id: 'issue_remittance', primary: true });
    }
    if (unattendedTransitions.includes('invoiced')) {
      candidates.push({ id: 'skip_to_invoiced', primary: true });
    }
    candidates.push({ id: 'admin_cancel', color: 'error' });
  } else if (ctx.billing_status === 'in_remittance') {
    candidates.push({
      id: 'register_invoice',
      primary: true,
      disabled: ocBlocked,
    });
    candidates.push({ id: 'admin_cancel', color: 'error' });
  } else if (ctx.billing_status === 'invoiced') {
    candidates.push({ id: 'apply_payment', primary: true });
    candidates.push({ id: 'admin_cancel', color: 'error' });
  } else if (ctx.billing_status === 'paid') {
    candidates.push({ id: 'open_warranty', primary: true });
  } else if (ctx.billing_status === 'canceled') {
    candidates.push({ id: 'revert_admin_cancellation', primary: true });
  }

  for (const candidate of candidates) {
    if (!isAdminActionAllowed(ctx, candidate.id)) {
      continue;
    }
    const labels: Record<RescueAdministrativeActionId, string> = {
      issue_remittance: RESCUE_ADMINISTRATIVE_BUTTON_LABELS.issueRemittance,
      skip_to_invoiced: RESCUE_ADMINISTRATIVE_BUTTON_LABELS.skipToInvoiced,
      register_invoice: RESCUE_ADMINISTRATIVE_BUTTON_LABELS.registerInvoice,
      apply_payment: RESCUE_ADMINISTRATIVE_BUTTON_LABELS.applyPayment,
      admin_cancel: RESCUE_ADMINISTRATIVE_BUTTON_LABELS.adminCancel,
      open_warranty: RESCUE_ADMINISTRATIVE_BUTTON_LABELS.openWarranty,
      save_purchase_order: RESCUE_ADMINISTRATIVE_BUTTON_LABELS.savePurchaseOrder,
      revert_admin_cancellation:
        RESCUE_ADMINISTRATIVE_BUTTON_LABELS.revertAdminCancellation,
    };
    actions.push({
      id: candidate.id,
      label: labels[candidate.id],
      primary: candidate.primary,
      color: candidate.color,
      disabled: candidate.disabled,
    });
  }

  return actions;
}
