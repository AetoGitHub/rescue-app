import type { PaymentDebtSource } from '~/constants/payment-api';
import {
  calendarDateToApiDate,
  type CalendarDateParts,
} from '~/utils/payment-list-query';

export interface PaymentDebtFilterInput {
  userId: number | null;
  payment?: boolean | null;
  folio?: string;
  source?: PaymentDebtSource | null;
  fromDate?: CalendarDateParts | null;
  toDate?: CalendarDateParts | null;
}

export function buildPaymentDebtQuery(
  input: PaymentDebtFilterInput,
): Record<string, string> | null {
  if (input.userId == null) return null;

  const query: Record<string, string> = {
    user: String(input.userId),
  };

  if (input.payment != null) {
    query.payment = input.payment ? 'true' : 'false';
  }

  const folio = input.folio?.trim();
  if (folio) query.folio = folio;

  if (input.source != null) {
    query.source = input.source;
  }

  const fromDate = calendarDateToApiDate(input.fromDate);
  if (fromDate) query.from_date = fromDate;

  const toDate = calendarDateToApiDate(input.toDate);
  if (toDate) query.to_date = toDate;

  return query;
}

export function paymentDebtQueryKey(input: PaymentDebtFilterInput): unknown[] {
  return [
    'payment-debt',
    input.userId ?? '',
    input.payment ?? '',
    input.folio?.trim() ?? '',
    input.source ?? '',
    calendarDateToApiDate(input.fromDate) ?? '',
    calendarDateToApiDate(input.toDate) ?? '',
  ];
}
