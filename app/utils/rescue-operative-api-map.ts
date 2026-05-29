import type { OperationalRescueStatus } from '~/constants/operational-kanban';
import type { RescueCardDetail } from '~/interfaces/rescue/detail';
import type {
  RescueAdvanceFormState,
  RescueOperativeActionId,
  RescueOperativeUpdateBody,
  RescueServiceCompletedFormState,
} from '~/interfaces/rescue/operative';

export function mapOperativePatchToApi(
  body: RescueOperativeUpdateBody,
): Record<string, unknown> {
  return { ...body };
}

export function toOperativeUpdatePayload(
  action: RescueOperativeActionId,
  detail: RescueCardDetail,
  forms?: {
    advance?: RescueAdvanceFormState;
    completed?: RescueServiceCompletedFormState;
    cancelReason?: string;
  },
): RescueOperativeUpdateBody {
  switch (action) {
    case 'send_to_authorization':
      return { operative_status: 'pending_authorization' };

    case 'approve_loan':
    case 'approve_without_advance':
      return {
        operative_status: 'approved',
        requires_advance: false,
        advance_amount: '0',
      };

    case 'request_advance':
      return {
        operative_status: 'waiting_advance_payment',
        advance_amount: forms?.advance?.advance_amount ?? '0',
        requires_advance: true,
      };

    case 'confirm_advance_received':
      return {
        operative_status: 'approved',
        advance_received: true,
        advance_amount: forms?.advance?.advance_amount,
        advance_date: forms?.advance?.advance_date,
        advance_payment_method: forms?.advance?.advance_payment_method,
        advance_reference: forms?.advance?.advance_reference,
      };

    case 'modify_advance_amount':
      return {
        advance_amount: forms?.advance?.advance_amount,
        requires_advance: true,
      };

    case 'cancel_advance':
      return {
        operative_status: 'pending_authorization',
        requires_advance: false,
        advance_amount: '0',
      };

    case 'start_project':
      return { operative_status: 'in_progress' };

    case 'complete_service':
    case 'complete_project':
    case 'confirm_disbursement':
      return buildClosePayload(detail, forms?.completed);

    case 'cancel_service':
      return {
        operative_status: 'canceled',
        cancel_reason: forms?.cancelReason,
      };

    case 'take_request':
      return { operative_status: 'active_without_quote' };

    default:
      return {};
  }
}

function buildClosePayload(
  detail: RescueCardDetail,
  completed?: RescueServiceCompletedFormState,
): RescueOperativeUpdateBody {
  const payload: RescueOperativeUpdateBody = {
    operative_status: 'closed_unpaid',
    close_date: completed?.close_date,
    supplier_ratings: completed?.ratings
      .filter((r) => r.score >= 1)
      .map((r) => ({
        supplier_id: r.supplier_id,
        score: r.score,
        comment: r.comment.trim() || undefined,
      })),
  };

  if (detail.service_type === 'loan' && completed) {
    payload.disbursement_date = completed.disbursement_date;
    payload.disbursement_payment_method = completed.disbursement_payment_method;
  }

  return payload;
}

export function targetStatusForAction(
  action: RescueOperativeActionId,
): OperationalRescueStatus | null {
  const map: Partial<Record<RescueOperativeActionId, OperationalRescueStatus>> = {
    send_to_authorization: 'pending_authorization',
    approve_loan: 'approved',
    approve_without_advance: 'approved',
    request_advance: 'waiting_advance_payment',
    confirm_advance_received: 'approved',
    cancel_advance: 'pending_authorization',
    start_project: 'in_progress',
    complete_service: 'closed_unpaid',
    complete_project: 'closed_unpaid',
    confirm_disbursement: 'closed_unpaid',
    cancel_service: 'canceled',
    take_request: 'active_without_quote',
  };
  return map[action] ?? null;
}
