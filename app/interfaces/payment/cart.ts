import type { PaymentListItem } from '~/interfaces/payment/payment-list';
import type { PaymentDebtItem } from '~/interfaces/payment/debt';

export interface PaymentCartSection {
  count: number;
  total_amount: string;
  items: PaymentListItem[];
}

export interface PaymentCartDebtSection {
  count: number;
  total_amount: string;
  items: PaymentDebtItem[];
}

export interface PaymentCartResponse {
  created_at: string | null;
  operative: PaymentCartSection;
  seller: PaymentCartSection;
  debt_voucher?: PaymentCartDebtSection;
}

export interface PaymentCartAddOperativeBody {
  operative_ids: number[];
}

export interface PaymentCartAddSellerBody {
  seller_ids: number[];
}
