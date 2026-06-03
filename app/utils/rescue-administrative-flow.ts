import type { StepperItem } from '@nuxt/ui';
import {
  ADMIN_BILLING_FLOWS,
  ADMINISTRATIVE_LINEAR_STEPS,
  type AdminClientType,
  RESCUE_ADMINISTRATIVE_BUTTON_LABELS,
  RESCUE_ADMINISTRATIVE_REMISSION_ALERT,
} from '~/constants/rescue-administrative-flow';
import type { AdministrativeBillingStatus } from '~/constants/administrative-kanban';
import { getBillingStatusLabel } from '~/utils/administrative-rescue-display';
import { targetBillingStatusForAction } from '~/utils/rescue-administrative-api-map';
import type { AdministrativeRescueDetail } from '~/interfaces/rescue/administrative';
import type {
  RescueAdministrativeActionId,
  RescueAdministrativeFlowContext,
  RescueAdministrativeFooterAction,
} from '~/interfaces/rescue/administrative';

export function administrativeDetailToFlowContext(
  detail: AdministrativeRescueDetail,
): RescueAdministrativeFlowContext {
  return {
    billing_status: detail.billing_status,
    operative_status: detail.operative_status,
    client_type: detail.client_type,
    billing_type: detail.billing_type,
    requires_remision: detail.requires_remision,
    requires_purchase_order: detail.requires_purchase_order,
    purchase_order_number: detail.purchase_order_number,
    remittance_number: detail.remittance_number,
    invoice_number: detail.invoice_number,
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

export function getAdministrativeRemissionAlert(
  ctx: RescueAdministrativeFlowContext,
): { title: string; description: string } | null {
  if (ctx.billing_status !== 'unattended' || !ctx.requires_remision) {
    return null;
  }

  return {
    title: RESCUE_ADMINISTRATIVE_REMISSION_ALERT.title,
    description: RESCUE_ADMINISTRATIVE_REMISSION_ALERT.description,
  };
}

export function normalizeAdminClientType(clientType: string): AdminClientType {
  const upper = clientType.trim().toUpperCase();
  if (upper === 'CREDIT' || upper === 'CASH' || upper === 'PUBLIC') {
    return upper;
  }
  return 'CASH';
}

export function getAdministrativeStepperSteps(
  ctx: RescueAdministrativeFlowContext,
): AdministrativeBillingStatus[] {
  return ADMINISTRATIVE_LINEAR_STEPS[normalizeAdminClientType(ctx.client_type)];
}

export function getValidAdminBillingTransitions(
  clientType: string,
  billingStatus: AdministrativeBillingStatus,
): AdministrativeBillingStatus[] {
  const normalized = normalizeAdminClientType(clientType);
  return ADMIN_BILLING_FLOWS[normalized][billingStatus] ?? [];
}

export function isAdminActionAllowed(
  ctx: RescueAdministrativeFlowContext,
  actionId: RescueAdministrativeActionId,
): boolean {
  if (actionId === 'save_purchase_order') {
    return true;
  }

  if (actionId === 'revert_admin_cancellation') {
    return ctx.billing_status === 'canceled';
  }

  if (actionId === 'issue_remittance') {
    return (
      ctx.billing_status === 'unattended'
      && ctx.requires_remision
      && getValidAdminBillingTransitions(ctx.client_type, ctx.billing_status).includes(
        'in_remittance',
      )
    );
  }

  if (actionId === 'skip_to_invoiced') {
    return (
      ctx.billing_status === 'unattended'
      && getValidAdminBillingTransitions(ctx.client_type, ctx.billing_status).includes(
        'invoiced',
      )
    );
  }

  const target = targetBillingStatusForAction(actionId);
  if (!target) {
    return false;
  }

  return getValidAdminBillingTransitions(
    ctx.client_type,
    ctx.billing_status,
  ).includes(target);
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
  const ocBlocked = isPurchaseOrderBlockingInvoice(ctx);
  const actions: RescueAdministrativeFooterAction[] = [];

  const candidates: Array<{
    id: RescueAdministrativeActionId;
    primary?: boolean;
    color?: RescueAdministrativeFooterAction['color'];
    disabled?: boolean;
  }> = [];

  if (ctx.billing_status === 'unattended') {
    if (ctx.requires_remision) {
      candidates.push({ id: 'issue_remittance', primary: true });
      candidates.push({ id: 'skip_to_invoiced', primary: true });
    } else {
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

