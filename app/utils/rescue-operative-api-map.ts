import type { OperationalRescueStatus } from '~/constants/operational-kanban';
import type { RescueCardDetail } from '~/interfaces/rescue/detail';
import type {
  RescueAdvanceFormState,
  RescueChangePhaseBody,
  RescueOperativeActionId,
  RescueServiceCompletedFormState,
} from '~/interfaces/rescue/operative';
import { formatAdvanceAmountForApi } from '~/utils/advance-amount';

export function mapOperativeUpdateToApi(
  body: RescueChangePhaseBody,
): RescueChangePhaseBody {
  const mapped: RescueChangePhaseBody = { to: body.to };
  if (body.advance_amount != null) {
    mapped.advance_amount = formatAdvanceAmountForApi(body.advance_amount);
  }
  if (body.advance_date) mapped.advance_date = body.advance_date;
  if (body.advance_payment_method) {
    mapped.advance_payment_method = body.advance_payment_method;
  }
  if (body.advance_reference) mapped.advance_reference = body.advance_reference;
  if (body.cancellation_reason != null) {
    mapped.cancellation_reason = body.cancellation_reason;
  }
  if (body.close_date) mapped.close_date = body.close_date;
  if (body.disbursement_date) mapped.disbursement_date = body.disbursement_date;
  if (body.disbursement_payment_method) {
    mapped.disbursement_payment_method = body.disbursement_payment_method;
  }
  if (body.supplier_ratings?.length) {
    mapped.supplier_ratings = body.supplier_ratings;
  }
  return mapped;
}

export function toOperativeUpdatePayload(
  action: RescueOperativeActionId,
  _detail: RescueCardDetail,
  forms?: {
    advance?: RescueAdvanceFormState;
    completed?: RescueServiceCompletedFormState;
    cancellationReasonId?: number | null;
  },
): RescueChangePhaseBody {
  switch (action) {
    case 'send_to_authorization':
      return { to: 'pending_authorization' };

    case 'approve_loan':
    case 'approve_without_advance':
      return { to: 'approved' };

    case 'request_advance':
      return {
        to: 'waiting_advance_payment',
        advance_amount: forms?.advance?.advance_amount ?? '0',
      };

    case 'confirm_advance_received':
      return {
        to: 'approved',
        advance_amount: forms?.advance?.advance_amount,
        advance_date: forms?.advance?.advance_date,
        advance_payment_method: forms?.advance?.advance_payment_method,
        advance_reference: forms?.advance?.advance_reference,
      };

    case 'modify_advance_amount':
      return {
        to: 'waiting_advance_payment',
        advance_amount: forms?.advance?.advance_amount,
      };

    case 'cancel_advance':
      return { to: 'pending_authorization' };

    case 'start_project':
      return { to: 'in_progress' };

    case 'complete_service':
    case 'complete_project':
    case 'confirm_disbursement':
      return buildClosePayload(forms?.completed);

    case 'cancel_service':
      return {
        to: 'canceled',
        cancellation_reason: forms?.cancellationReasonId ?? undefined,
      };

    case 'take_request':
      return { to: 'active_without_quote' };

    case 'mark_as_closed':
      return { to: 'closed' };
  }
}

function buildClosePayload(
  completed?: RescueServiceCompletedFormState,
): RescueChangePhaseBody {
  const payload: RescueChangePhaseBody = {
    to: 'closed_unpaid',
    close_date: completed?.close_date,
    supplier_ratings: completed?.ratings
      .filter((r) => r.score >= 1)
      .map((r) => ({
        supplier_id: r.supplier_id,
        score: r.score,
        comment: r.comment.trim() || undefined,
      })),
  };

  if (completed) {
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
    modify_advance_amount: 'waiting_advance_payment',
    cancel_advance: 'pending_authorization',
    start_project: 'in_progress',
    complete_service: 'closed_unpaid',
    complete_project: 'closed_unpaid',
    confirm_disbursement: 'closed_unpaid',
    cancel_service: 'canceled',
    take_request: 'active_without_quote',
    mark_as_closed: 'closed',
  };
  return map[action] ?? null;
}
