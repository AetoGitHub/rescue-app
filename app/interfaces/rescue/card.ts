import type { OperationalRescueStatus } from '~/constants/operational-kanban';

export interface RescueCardBase {
  id: number;
  folio: string;
  service_type?: string | null;
  client_id: number;
  client_name: string;
  service_description: string;
  location_description: string;
  /** Número económico; null o vacío si no aplica. */
  vehicle: string | null;
  total: string | null;
  operative_status: OperationalRescueStatus;
  operator_id: number | null;
  operator_name: string | null;
  supplier_id: number | null;
  supplier_name: string | null;
  multiple_managers: boolean;
  sub_total: string | null;
  admin_status: string;
  created_at: string;
  phase_started_at: string;
  last_comment_at?: string | null;
  unlocked_until: string | null;
}

export interface RescueCardWaitingAdvance extends RescueCardBase {
  operative_status: 'waiting_advance_payment';
}

export interface RescueCardApproved extends RescueCardBase {
  operative_status: 'approved';
  approved_amount?: string | null;
}

export interface RescueCardInProgress extends RescueCardBase {
  operative_status: 'in_progress';
  elapsed_minutes?: number;
}

export interface RescueCardClosed extends RescueCardBase {
  operative_status: 'closed';
  total_collected?: string | null;
}

export type RescueCard =
  | RescueCardWaitingAdvance
  | RescueCardApproved
  | RescueCardInProgress
  | RescueCardClosed
  | RescueCardBase;
