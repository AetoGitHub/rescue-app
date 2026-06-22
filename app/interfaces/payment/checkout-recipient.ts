import type { PaymentRecipientType } from '~/constants/payment-api';

export interface PaymentCheckoutRecipient {
  type: PaymentRecipientType;
  userId: number;
  userName: string | null;
}
