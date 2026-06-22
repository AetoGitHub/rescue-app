import type { PaymentRecipientType } from '~/constants/payment-api';
import type { PaymentDebtItem } from '~/interfaces/payment/debt';

export interface PaymentReceiptSummary {
  id: number;
  payment_type: PaymentRecipientType;
  total_amount: string;
  created_by: string;
  created_at: string;
}

export interface PaymentReceiptOperativeItem {
  id: number;
  rescue_folio: string;
  operator_id: number;
  operator_name: string;
  operator_commission: string;
  amount: string;
  is_penalty: boolean;
  penalty_applied: string;
  penalty_amount: string;
  penalty_forgiven: boolean;
  date_payment: string;
}

export interface PaymentReceiptSellerItem {
  id: number;
  rescue_folio: string;
  seller_id?: number;
  seller_name?: string;
  seller_commission?: string;
  amount: string;
  date_payment: string;
}

export interface PaymentReceiptDetail extends PaymentReceiptSummary {
  operative: PaymentReceiptOperativeItem[];
  seller: PaymentReceiptSellerItem[];
  debt: PaymentDebtItem[];
}
