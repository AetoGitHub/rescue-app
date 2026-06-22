import type { PaymentListItem } from '~/interfaces/payment/payment-list';

export interface PaymentCartSection {
  count: number;
  total_amount: string;
  items: PaymentListItem[];
}

export interface PaymentCartResponse {
  created_at: string | null;
  operative: PaymentCartSection;
  seller: PaymentCartSection;
}

export interface PaymentCartAddOperativeBody {
  operative_ids: number[];
}

export interface PaymentCartAddSellerBody {
  seller_ids: number[];
}
