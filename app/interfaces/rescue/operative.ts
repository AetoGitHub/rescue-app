import type { OperationalRescueStatus } from '~/constants/operational-kanban';
import type { RescuePaymentMethod } from '~/constants/rescue-operative-flow';
import type { RescueServiceType } from '~/interfaces/rescue';

export type RescueAdvancePanelMode =
  | 'request'
  | 'approve_without'
  | 'confirm'
  | 'modify';

export type RescueOperativeActionId =
  | 'send_to_authorization'
  | 'cancel_service'
  | 'approve_loan'
  | 'request_advance'
  | 'approve_without_advance'
  | 'confirm_advance_received'
  | 'modify_advance_amount'
  | 'cancel_advance'
  | 'complete_service'
  | 'confirm_disbursement'
  | 'start_project'
  | 'complete_project'
  | 'take_request';

/** POST /api/rescue/change_phase/{rescue_pk}/ */
export interface RescueChangePhaseBody {
  to: OperationalRescueStatus;
  advance_amount?: string;
  advance_date?: string;
  advance_payment_method?: string;
  advance_reference?: string;
  close_date?: string;
  disbursement_date?: string;
  disbursement_payment_method?: string;
  cancel_reason?: string;
  supplier_ratings?: RescueSupplierRatingPayload[];
}

/** @deprecated Use RescueChangePhaseBody */
export type RescueOperativeUpdateBody = RescueChangePhaseBody;

export interface RescueSupplierRatingPayload {
  supplier_id: number;
  score: number;
  comment?: string;
}

export interface RescueSupplierRatingRow {
  supplier_id: number;
  supplier_name: string;
  score: number;
  comment: string;
}

export interface RescueAdvanceFormState {
  advance_amount: string;
  advance_date: string;
  advance_payment_method: RescuePaymentMethod | '';
  advance_reference: string;
}

export interface RescueServiceCompletedFormState {
  close_date: string;
  disbursement_date: string;
  disbursement_payment_method: RescuePaymentMethod | '';
  ratings: RescueSupplierRatingRow[];
}

export interface RescueFooterAction {
  id: RescueOperativeActionId;
  label: string;
  color?: 'primary' | 'neutral' | 'error';
  variant?: 'solid' | 'subtle' | 'outline';
  disabled?: boolean;
  disabledReason?: string;
  primary?: boolean;
}

export interface RescueOperativeFlowContext {
  service_type: RescueServiceType | string;
  operative_status: OperationalRescueStatus | string;
  quote_count?: number;
  sub_total?: string | null;
  sale_price?: string | null;
  advance_amount?: string | number | null;
  credit_limit?: string | number | null;
  credit_available?: number | null;
  supplier_id?: number | null;
  supplier_name?: string | null;
}
