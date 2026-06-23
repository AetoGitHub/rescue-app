import { getLocalTimeZone, today, type CalendarDate } from '@internationalized/date';
import type {
  PaymentListPaymentStatus,
  PaymentRecipientType,
} from '~/constants/payment-api';
import { resolvePaymentListPaymentFilter } from '~/constants/payment-api';
import type { PaymentListItem } from '~/interfaces/payment/payment-list';

export type CalendarDateParts = Pick<CalendarDate, 'year' | 'month' | 'day'>;

export function compareCalendarDateParts(
  a: CalendarDateParts,
  b: CalendarDateParts,
): number {
  if (a.year !== b.year) return a.year - b.year;
  if (a.month !== b.month) return a.month - b.month;
  return a.day - b.day;
}

export function minCalendarDateParts(
  a: CalendarDateParts,
  b: CalendarDateParts,
): CalendarDateParts {
  return compareCalendarDateParts(a, b) <= 0 ? a : b;
}

export function todayCalendarDateParts(): CalendarDateParts {
  const value = today(getLocalTimeZone());
  return { year: value.year, month: value.month, day: value.day };
}

export interface PaymentListFilterInput {
  type: PaymentRecipientType;
  userId: number | null;
  folio?: string;
  fromDate?: CalendarDateParts | null;
  toDate?: CalendarDateParts | null;
  /** null = todos (no enviar qp); true/false = payment en query */
  payment?: boolean | null;
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

  if (input.payment === true) {
    query.payment = 'true';
  } else if (input.payment === false) {
    query.payment = 'false';
  }

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
  const paymentKey =
    filters.payment === true
      ? 'true'
      : filters.payment === false
        ? 'false'
        : 'all';

  return [
    'payment-list',
    filters.type,
    filters.userId ?? '',
    filters.folio?.trim() ?? '',
    calendarDateToApiDate(filters.fromDate) ?? '',
    calendarDateToApiDate(filters.toDate) ?? '',
    paymentKey,
  ];
}

export function paymentStatusToFilterValue(
  status: PaymentListPaymentStatus,
): boolean | null {
  return resolvePaymentListPaymentFilter(status);
}

export function paymentFilterToStatus(
  payment: boolean | null | undefined,
): PaymentListPaymentStatus {
  if (payment === true) return 'paid';
  if (payment === false) return 'pending';
  return 'all';
}

export function isPaymentListRowSelectable(row: PaymentListItem): boolean {
  return !row.payment;
}
