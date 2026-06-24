import type { AdministrativeBillingStatus } from '~/constants/administrative-kanban';
import type { OperationalRescueStatus } from '~/constants/operational-kanban';
import type { ClientBillingType } from '~/constants/rescue-administrative-flow';
import type { RescueServiceType } from '~/interfaces/rescue';

export type RescueAdministrativeActionId =
  | 'issue_remittance'
  | 'skip_to_invoiced'
  | 'register_invoice'
  | 'apply_payment'
  | 'admin_cancel'
  | 'open_warranty'
  | 'save_purchase_order'
  | 'revert_admin_cancellation';

/**
 * Administrative board card. `billing_status` is the frontend name for API `admin_status`
 * (billing/collections workflow — not gestor agent status on operational cards).
 */
export interface AdministrativeRescueCard {
  id: number;
  folio: string;
  service_type: RescueServiceType | string;
  client_id: number;
  client_name: string;
  service_description: string;
  location_description: string;
  operator_id: number | null;
  operator_name: string | null;
  supplier_id: number | null;
  supplier_name: string | null;
  multiple_managers: boolean;
  sub_total: string | null;
  /** Display alias mapped from `sub_total` */
  sale_price: string | null;
  net_profit: string | null;
  operative_status: OperationalRescueStatus;
  billing_status: AdministrativeBillingStatus;
  created_at: string;
  phase_started_at: string | null;
  last_comment_at: string | null;
  unlocked_until: string | null;
  /** List column "Fecha" — from phase_started_at when no service_date on API */
  service_date: string | null;
  seller_id: number | null;
  remittance_folio: string | null;
  invoice_folio: string | null;
}

export interface AdministrativeRescueDetail extends AdministrativeRescueCard {
  client_type: string;
  /** API `client_billing_type`; alias `billing_type` on legacy payloads */
  client_billing_type: ClientBillingType;
  /** @deprecated Prefer client_billing_type */
  billing_type: string | null;
  client_phone: string | null;
  seller_name: string | null;
  requires_purchase_order: boolean;
  purchase_order_number: string | null;
  /** Derived from client_billing_type (MANUAL | REMISSION) */
  requires_remision: boolean;
  remittance_number: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  invoice_amount: string | null;
  payment_amount: string | null;
  payment_date: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  closed_at: string | null;
  admin_cancellation_reason: string | null;
  admin_cancellation_reason_id: number | null;
  provider_cost: string | null;
  vehicle: string | null;
  latitude: string | null;
  longitude: string | null;
  supplier_score: number | null;
}

/** Internal change body; phase transitions map to `change_admin_status` API. */
export interface RescueAdministrativeChangePhaseBody {
  billing_status?: AdministrativeBillingStatus;
  remittance_number?: string;
  invoice_number?: string;
  invoice_date?: string;
  invoice_amount?: string;
  invoice_notes?: string;
  payment_evidence_url?: string;
  purchase_order_number?: string;
  admin_cancellation_reason?: number;
}

export interface RescueAdministrativeRevertCancellationBody {
  reacceptance_reason: number;
}

export interface RescueUnlockBody {
  unlocked_until: string;
  reason: string;
}

export interface RescueAdministrativeFlowContext {
  billing_status: AdministrativeBillingStatus;
  operative_status: OperationalRescueStatus;
  client_type: string;
  client_billing_type: ClientBillingType;
  requires_remision: boolean;
  requires_purchase_order: boolean;
  purchase_order_number: string | null;
  remittance_number: string | null;
  invoice_number: string | null;
}

export interface RescueAdministrativeFooterAction {
  id: RescueAdministrativeActionId;
  label: string;
  primary?: boolean;
  color?: 'primary' | 'neutral' | 'error';
  disabled?: boolean;
}

export interface RescueRemittanceFormState {
  remittance_number: string;
}

export interface RescueInvoiceFormState {
  invoice_number: string;
  invoice_date: string;
  invoice_amount: string;
}

export interface RescueAdministrativePaymentFormState {
  payment_evidence_url: string;
}
