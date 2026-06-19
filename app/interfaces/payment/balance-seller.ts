export interface SellerBalanceVoucher {
  id: number;
  rescue_folio: string;
  rescue_operative_status: string;
  rescue_admin_status: string;
  operator_name: string;
  operator_commission: string;
  amount: string;
  created_at: string;
}

export interface SellerBalanceResponse {
  results: SellerBalanceVoucher[];
  total: string;
}
