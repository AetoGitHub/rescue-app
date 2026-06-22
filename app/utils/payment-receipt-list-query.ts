import type { PaymentRecipientType } from '~/constants/payment-api';
import {
  calendarDateToApiDate,
  type CalendarDateParts,
} from '~/utils/payment-list-query';

export interface PaymentReceiptListFilterInput {
  paymentType?: PaymentRecipientType | null;
  userId?: number | null;
  fromDate?: CalendarDateParts | null;
  toDate?: CalendarDateParts | null;
}

export function buildPaymentReceiptListQuery(
  input: PaymentReceiptListFilterInput = {},
): Record<string, string> {
  const query: Record<string, string> = {};

  if (input.paymentType != null) {
    query.payment_type = input.paymentType;
  }

  if (input.userId != null) {
    query.user = String(input.userId);
  }

  const fromDate = calendarDateToApiDate(input.fromDate);
  if (fromDate) query.from_date = fromDate;

  const toDate = calendarDateToApiDate(input.toDate);
  if (toDate) query.to_date = toDate;

  return query;
}

export function paymentReceiptListQueryKey(
  filters: PaymentReceiptListFilterInput,
): (string | number)[] {
  return [
    'payment-receipt-list',
    filters.paymentType ?? '',
    filters.userId ?? '',
    calendarDateToApiDate(filters.fromDate) ?? '',
    calendarDateToApiDate(filters.toDate) ?? '',
  ];
}
