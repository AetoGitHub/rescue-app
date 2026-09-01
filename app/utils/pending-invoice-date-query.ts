import {
  CalendarDateTime,
  getLocalTimeZone,
  startOfMonth,
  today,
  toZoned,
} from '@internationalized/date';
import {
  compareCalendarDateParts,
  type CalendarDateParts,
} from '~/utils/payment-list-query';
import type { PaginatedQueryValue } from '~/utils/catalog-pagination';

export type PendingInvoiceDateBoundary = 'start' | 'end';

function calendarDatePartsToday(
  timeZone: string = getLocalTimeZone(),
): CalendarDateParts {
  const value = today(timeZone);
  return { year: value.year, month: value.month, day: value.day };
}

/** First calendar day of the current month in the user's timezone. */
export function pendingInvoiceDefaultStartDate(
  timeZone: string = getLocalTimeZone(),
): CalendarDateParts {
  const value = startOfMonth(today(timeZone));
  return { year: value.year, month: value.month, day: value.day };
}

/** Today's calendar day in the user's timezone. */
export function pendingInvoiceDefaultEndDate(
  timeZone: string = getLocalTimeZone(),
): CalendarDateParts {
  return calendarDatePartsToday(timeZone);
}

export function isPendingInvoiceDefaultDateRange(
  startDate: CalendarDateParts | null | undefined,
  endDate: CalendarDateParts | null | undefined,
  timeZone: string = getLocalTimeZone(),
): boolean {
  if (startDate == null || endDate == null) return false;
  return (
    compareCalendarDateParts(startDate, pendingInvoiceDefaultStartDate(timeZone)) === 0
    && compareCalendarDateParts(endDate, pendingInvoiceDefaultEndDate(timeZone)) === 0
  );
}

function padDatePart(value: number): string {
  return String(value).padStart(2, '0');
}

/**
 * Formats a millisecond UTC offset as `±HH:mm` (never `Z`) so the API always
 * receives an explicit timezone.
 */
export function formatUtcOffsetIso(offsetMs: number): string {
  const sign = offsetMs >= 0 ? '+' : '-';
  const absolute = Math.abs(offsetMs);
  const hours = Math.floor(absolute / 3_600_000);
  const minutes = Math.floor((absolute % 3_600_000) / 60_000);
  return `${sign}${padDatePart(hours)}:${padDatePart(minutes)}`;
}

/**
 * Calendar day → ISO-8601 datetime with the user's timezone offset.
 *
 * `start` is local midnight; `end` is 23:59:59 local so the last day stays
 * inclusive. Example in America/Mexico_City: `2026-09-01T00:00:00-06:00`.
 */
export function calendarDateToZonedApiDateTime(
  date: CalendarDateParts | null | undefined,
  boundary: PendingInvoiceDateBoundary,
  timeZone: string = getLocalTimeZone(),
): string | undefined {
  if (date == null) return undefined;

  const hour = boundary === 'start' ? 0 : 23;
  const minute = boundary === 'start' ? 0 : 59;
  const second = boundary === 'start' ? 0 : 59;
  const zoned = toZoned(
    new CalendarDateTime(
      date.year,
      date.month,
      date.day,
      hour,
      minute,
      second,
    ),
    timeZone,
  );

  return `${zoned.year}-${padDatePart(zoned.month)}-${padDatePart(zoned.day)}T${padDatePart(zoned.hour)}:${padDatePart(zoned.minute)}:${padDatePart(zoned.second)}${formatUtcOffsetIso(zoned.offset)}`;
}

export function applyPendingInvoiceDateQuery(
  query: Record<string, PaginatedQueryValue>,
  startDate: CalendarDateParts | null | undefined,
  endDate: CalendarDateParts | null | undefined,
  timeZone?: string,
): Record<string, PaginatedQueryValue> {
  const start = calendarDateToZonedApiDateTime(startDate, 'start', timeZone);
  const end = calendarDateToZonedApiDateTime(endDate, 'end', timeZone);
  if (start) query.start_date = start;
  if (end) query.end_date = end;
  return query;
}
