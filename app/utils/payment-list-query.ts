import type { CalendarDate } from '@internationalized/date';
import type { PaymentRecipientType } from '~/constants/payment-api';

export type CalendarDateParts = Pick<CalendarDate, 'year' | 'month' | 'day'>;

export interface PaymentListFilterInput {
  type: PaymentRecipientType;
  userId: number | null;
  folio?: string;
  fromDate?: CalendarDateParts | null;
  toDate?: CalendarDateParts | null;
}

export function calendarDateToApiDate(
  date: CalendarDateParts | null | undefined,
): string | undefined {
  if (!date) return undefined;
  const month = String(date.month).padStart(2, '0');
  const day = String(date.day).padStart(2, '0');
  return `${date.year}-${month}-${day}`;
}

export function buildPaymentListQuery(
  input: PaymentListFilterInput,
): Record<string, string> | null {
  if (input.userId == null) return null;

  const query: Record<string, string> =
    input.type === 'operative'
      ? { operator: String(input.userId) }
      : { seller: String(input.userId) };

  const folio = input.folio?.trim();
  if (folio) query.folio = folio;

  const fromDate = calendarDateToApiDate(input.fromDate);
  if (fromDate) query.from_date = fromDate;

  const toDate = calendarDateToApiDate(input.toDate);
  if (toDate) query.to_date = toDate;

  return query;
}

export function buildPaymentCartAddAllQuery(
  filters: PaymentListFilterInput,
): Record<string, string> | null {
  const base = buildPaymentListQuery(filters);
  if (!base) return null;
  return { ...base, all: 'true' };
}

export function paymentListQueryKey(
  filters: PaymentListFilterInput,
): (string | number)[] {
  return [
    'payment-list',
    filters.type,
    filters.userId ?? '',
    filters.folio?.trim() ?? '',
    calendarDateToApiDate(filters.fromDate) ?? '',
    calendarDateToApiDate(filters.toDate) ?? '',
  ];
}
