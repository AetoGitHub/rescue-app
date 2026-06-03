import type { StepperItem } from '@nuxt/ui';
import {
  ADMINISTRATIVE_LINEAR_STEPS,
  RESCUE_ADMINISTRATIVE_BUTTON_LABELS,
  RESCUE_ADMINISTRATIVE_REMISSION_ALERT,
} from '~/constants/rescue-administrative-flow';
import type { AdministrativeBillingStatus } from '~/constants/administrative-kanban';
import { getBillingStatusLabel } from '~/utils/administrative-rescue-display';
import type { AdministrativeRescueDetail } from '~/interfaces/rescue/administrative';
import type {
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

export function getAdministrativeStepperSteps(
  ctx: RescueAdministrativeFlowContext,
): AdministrativeBillingStatus[] {
  if (ctx.client_type === 'PUBLIC') {
    return ADMINISTRATIVE_LINEAR_STEPS.PUBLIC;
  }

  if (ctx.client_type === 'CREDIT') {
    return ADMINISTRATIVE_LINEAR_STEPS.CREDIT;
  }

  return ADMINISTRATIVE_LINEAR_STEPS.CASH;
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

  switch (ctx.billing_status) {
    case 'unattended': {
      const actions: RescueAdministrativeFooterAction[] = [];
      if (ctx.requires_remision) {
        actions.push({
          id: 'issue_remittance',
          label: RESCUE_ADMINISTRATIVE_BUTTON_LABELS.issueRemittance,
          primary: true,
        });
      } else {
        actions.push({
          id: 'skip_to_invoiced',
          label: RESCUE_ADMINISTRATIVE_BUTTON_LABELS.skipToInvoiced,
          primary: true,
        });
      }
      actions.push({
        id: 'admin_cancel',
        label: RESCUE_ADMINISTRATIVE_BUTTON_LABELS.adminCancel,
        color: 'error',
      });
      return actions;
    }

    case 'in_remittance':
      return [
        {
          id: 'register_invoice',
          label: RESCUE_ADMINISTRATIVE_BUTTON_LABELS.registerInvoice,
          primary: true,
          disabled: ocBlocked,
        },
        {
          id: 'admin_cancel',
          label: RESCUE_ADMINISTRATIVE_BUTTON_LABELS.adminCancel,
          color: 'error',
        },
      ];

    case 'invoiced':
      return [
        {
          id: 'apply_payment',
          label: RESCUE_ADMINISTRATIVE_BUTTON_LABELS.applyPayment,
          primary: true,
        },
        {
          id: 'admin_cancel',
          label: RESCUE_ADMINISTRATIVE_BUTTON_LABELS.adminCancel,
          color: 'error',
        },
      ];

    case 'paid':
      return [
        {
          id: 'open_warranty',
          label: RESCUE_ADMINISTRATIVE_BUTTON_LABELS.openWarranty,
          primary: true,
        },
      ];

    case 'warranty':
    case 'canceled':
    case 'invalid':
    default:
      return [];
  }
}

