export interface OperativeBalanceVoucher {
  id: number;
  rescue_folio: string;
  rescue_operative_status: string;
  rescue_admin_status: string;
  operator_name: string;
  operator_commission: string;
  amount: string;
  is_penalty: boolean;
  penalty_applied: string;
  penalty_amount: string;
  created_at: string;
}

export interface OperativeBalanceResponse {
  results: OperativeBalanceVoucher[];
  total: string;
}
