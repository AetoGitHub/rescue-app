import type { PaymentDebtSource } from '~/constants/payment-api';

export interface PaymentDebtItem {
  id: number;
  rescue_folio: string | null;
  rescue_operative_status?: string;
  rescue_admin_status?: string;
  user_id: number;
  user_name: string;
  amount: string;
  payment: boolean;
  source: PaymentDebtSource;
  comment: string | null;
  created_at: string;
}

export interface PaymentDebtCreateBody {
  user: number;
  source: PaymentDebtSource;
  amount: number;
  comment?: string;
}
