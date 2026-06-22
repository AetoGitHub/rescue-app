export interface PaymentListItem {
  id: number;
  rescue_folio: string;
  amount: string;
  payment: boolean;
  is_penalty: boolean;
  created_at: string;
  client_name: string | null;
  awn_date: string | null;
  operator_name?: string;
  seller_name?: string;
  rescue_operative_status?: string;
  rescue_admin_status?: string;
  rescue_id?: number;
  debt_created_at?: string;
  paid_at?: string | null;
}
