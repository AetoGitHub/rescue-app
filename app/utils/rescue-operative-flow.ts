import { OPERATIONAL_KANBAN_COLUMNS } from '~/constants/operational-kanban';
import { RESCUE_OPERATIVE_BUTTON_LABELS } from '~/constants/rescue-operative-flow';
import type { OperationalRescueStatus } from '~/constants/operational-kanban';
import type { RescueServiceType } from '~/interfaces/rescue';
import type {
  RescueFooterAction,
  RescueOperativeFlowContext,
  RescueSupplierRatingRow,
} from '~/interfaces/rescue/operative';
import type { RescueCardDetail } from '~/interfaces/rescue/detail';
import { parseRescueCardMoney } from '~/utils/operational-rescue-card';

export function rescueDetailToFlowContext(
  detail: RescueCardDetail,
): RescueOperativeFlowContext {
  return {
    service_type: detail.service_type,
    operative_status: detail.operative_status,
    quote_count: detail.quote_count,
    sub_total: detail.sub_total,
    sale_price: detail.sale_price,
    advance_amount: detail.advance_amount,
    credit_limit: detail.credit_limit,
    credit_available: detail.credit_available,
    supplier_id: detail.supplier_id,
    supplier_name: detail.supplier_name,
  };
}

export function hasRescueQuote(ctx: RescueOperativeFlowContext): boolean {
  if (ctx.quote_count != null && ctx.quote_count > 0) return true;
  return parseRescueCardMoney(ctx.sub_total) > 0;
}

export function parseAdvanceAmount(
  value: string | number | null | undefined,
): number {
  if (value == null) return 0;
  return parseRescueCardMoney(value);
}

export function isLoanCreditExceeded(ctx: RescueOperativeFlowContext): boolean {
  const limit = parseRescueCardMoney(ctx.credit_limit);
  if (limit <= 0) return false;
  const sale = parseRescueCardMoney(ctx.sale_price);
  const available = ctx.credit_available ?? 0;
  return sale > available;
}

export function getQuoteTotalForAdvance(ctx: RescueOperativeFlowContext): number {
  const sub = parseRescueCardMoney(ctx.sub_total);
  const sale = parseRescueCardMoney(ctx.sale_price);
  return sale > 0 ? sale : sub;
}

export function todayIsoDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function buildSupplierRatingRows(
  detail: RescueCardDetail,
): RescueSupplierRatingRow[] {
  const fromApi = detail.assigned_suppliers;
  if (fromApi?.length) {
    return fromApi.map((s) => ({
      supplier_id: s.id,
      supplier_name: s.name,
      score: 0,
      comment: '',
    }));
  }
  if (detail.supplier_id != null) {
    return [
      {
        supplier_id: detail.supplier_id,
        supplier_name: detail.supplier_name?.trim() || `Proveedor #${detail.supplier_id}`,
        score: 0,
        comment: '',
      },
    ];
  }
  return [];
}

function action(
  partial: RescueFooterAction,
): RescueFooterAction {
  return partial;
}

const CANCEL_SERVICE_ACTION = action({
  id: 'cancel_service',
  label: RESCUE_OPERATIVE_BUTTON_LABELS.cancelService,
  color: 'error',
});

function pendingAuthorizationActions(
  ctx: RescueOperativeFlowContext,
): RescueFooterAction[] {
  const serviceType = ctx.service_type as RescueServiceType;

  if (serviceType === 'loan') {
    if (isLoanCreditExceeded(ctx)) {
      return [
        action({
          id: 'approve_loan',
          label: RESCUE_OPERATIVE_BUTTON_LABELS.creditExceeded,
          primary: true,
          disabled: true,
        }),
      ];
    }
    return [
      action({
        id: 'approve_loan',
        label: RESCUE_OPERATIVE_BUTTON_LABELS.approveLoan,
        primary: true,
      }),
    ];
  }

  const hasAdvance = parseAdvanceAmount(ctx.advance_amount) > 0;
  const request = action({
    id: 'request_advance',
    label: RESCUE_OPERATIVE_BUTTON_LABELS.requestAdvance,
    primary: hasAdvance,
    variant: hasAdvance ? 'solid' : 'outline',
  });
  const approveWithout = action({
    id: 'approve_without_advance',
    label: RESCUE_OPERATIVE_BUTTON_LABELS.approveWithoutAdvance,
    primary: !hasAdvance,
    variant: !hasAdvance ? 'solid' : 'outline',
  });

  return hasAdvance
    ? [request, approveWithout]
    : [approveWithout, request];
}

export function getRescueDetailFooterActions(
  ctx: RescueOperativeFlowContext,
): RescueFooterAction[] {
  const status = ctx.operative_status as OperationalRescueStatus;
  const serviceType = ctx.service_type as RescueServiceType;

  switch (status) {
    case 'active_without_quote':
      return [
        action({
          id: 'send_to_authorization',
          label: RESCUE_OPERATIVE_BUTTON_LABELS.sendToAuthorization,
          primary: true,
        }),
      ];

    case 'pending_authorization':
      return pendingAuthorizationActions(ctx);

    case 'waiting_advance_payment':
      return [
        action({
          id: 'confirm_advance_received',
          label: RESCUE_OPERATIVE_BUTTON_LABELS.confirmAdvanceReceived,
          primary: true,
        }),
        action({
          id: 'modify_advance_amount',
          label: RESCUE_OPERATIVE_BUTTON_LABELS.modifyAdvanceAmount,
          variant: 'outline',
        }),
        action({
          id: 'cancel_advance',
          label: RESCUE_OPERATIVE_BUTTON_LABELS.cancelAdvance,
          color: 'neutral',
          variant: 'subtle',
        }),
      ];

    case 'approved':
      if (serviceType === 'proyect') {
        return [
          action({
            id: 'start_project',
            label: RESCUE_OPERATIVE_BUTTON_LABELS.startProject,
            primary: true,
          }),
        ];
      }
      if (serviceType === 'loan') {
        return [
          action({
            id: 'confirm_disbursement',
            label: RESCUE_OPERATIVE_BUTTON_LABELS.confirmDisbursement,
            primary: true,
          }),
        ];
      }
      return [
        action({
          id: 'complete_service',
          label: RESCUE_OPERATIVE_BUTTON_LABELS.completeService,
          primary: true,
        }),
      ];

    case 'in_progress':
      if (serviceType === 'proyect') {
        return [
          action({
            id: 'complete_project',
            label: RESCUE_OPERATIVE_BUTTON_LABELS.completeProject,
            primary: true,
          }),
        ];
      }
      return [];

    case 'requested':
      return [
        action({
          id: 'take_request',
          label: RESCUE_OPERATIVE_BUTTON_LABELS.takeRequest,
          primary: true,
        }),
      ];

    default:
      return [];
  }
}

function operativeStatusLabel(status: string): string {
  return (
    OPERATIONAL_KANBAN_COLUMNS.find((column) => column.status === status)
      ?.title ?? status
  );
}

export function getRescueDetailFooterFlowLabel(
  ctx: RescueOperativeFlowContext,
): string {
  const status = ctx.operative_status;
  const next = getRescueDetailFooterActions(ctx)[0]?.label ?? 'Siguiente paso';
  return `${operativeStatusLabel(status)} > ${next}`;
}

export function getRescueDetailPrimaryActionLabel(
  ctx: RescueOperativeFlowContext,
): string {
  const primary = getRescueDetailFooterActions(ctx).find((a) => a.primary);
  return primary?.label ?? 'Continuar';
}

export function shouldAutoSendDirectBudgetToAuthorization(
  ctx: RescueOperativeFlowContext,
): boolean {
  return (
    ctx.operative_status === 'active_without_quote'
    && ctx.service_type === 'direct_budget'
  );
}

export function requiresQuoteBeforeAuthorization(
  ctx: RescueOperativeFlowContext,
): boolean {
  if (ctx.service_type === 'loan') return false;
  if (ctx.service_type === 'direct_budget') return false;
  return !hasRescueQuote(ctx);
}

export function getMoreOptionsActions(
  ctx: RescueOperativeFlowContext,
): RescueFooterAction[] {
  const status = ctx.operative_status;
  if (
    status === 'active_without_quote'
    || status === 'pending_authorization'
    || status === 'waiting_advance_payment'
  ) {
    return [CANCEL_SERVICE_ACTION];
  }
  return [];
}
