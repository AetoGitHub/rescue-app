import { describe, expect, it } from 'vitest';
import {
  applyPendingInvoiceDateQuery,
  calendarDateToZonedApiDateTime,
  formatUtcOffsetIso,
} from '../../app/utils/pending-invoice-date-query';

function date(year: number, month: number, day: number) {
  return { year, month, day };
}

describe('pending-invoice-date-query', () => {
  it('formatUtcOffsetIso never uses Z', () => {
    expect(formatUtcOffsetIso(0)).toBe('+00:00');
    expect(formatUtcOffsetIso(-6 * 3_600_000)).toBe('-06:00');
    expect(formatUtcOffsetIso(5 * 3_600_000 + 30 * 60_000)).toBe('+05:30');
  });

  it('sends start_date at local midnight with timezone offset', () => {
    expect(
      calendarDateToZonedApiDateTime(
        date(2026, 9, 1),
        'start',
        'America/Mexico_City',
      ),
    ).toBe('2026-09-01T00:00:00-06:00');
  });

  it('sends end_date at local end of day with timezone offset', () => {
    expect(
      calendarDateToZonedApiDateTime(
        date(2026, 9, 15),
        'end',
        'America/Mexico_City',
      ),
    ).toBe('2026-09-15T23:59:59-06:00');
  });

  it('uses the zone offset for the selected calendar day (DST)', () => {
    expect(
      calendarDateToZonedApiDateTime(
        date(2026, 1, 15),
        'start',
        'America/New_York',
      ),
    ).toBe('2026-01-15T00:00:00-05:00');

    expect(
      calendarDateToZonedApiDateTime(
        date(2026, 7, 15),
        'start',
        'America/New_York',
      ),
    ).toBe('2026-07-15T00:00:00-04:00');
  });

  it('omits empty dates from the query', () => {
    expect(calendarDateToZonedApiDateTime(null, 'start')).toBeUndefined();
    expect(
      applyPendingInvoiceDateQuery({}, date(2026, 3, 5), null, 'UTC'),
    ).toEqual({
      start_date: '2026-03-05T00:00:00+00:00',
    });
  });

  it('applies both query params when both dates are set', () => {
    expect(
      applyPendingInvoiceDateQuery(
        { company: '4' },
        date(2026, 3, 5),
        date(2026, 3, 10),
        'America/Mexico_City',
      ),
    ).toEqual({
      company: '4',
      start_date: '2026-03-05T00:00:00-06:00',
      end_date: '2026-03-10T23:59:59-06:00',
    });
  });
});
