import { describe, expect, it } from 'vitest';
import {
  buildPaymentCartAddAllQuery,
  buildPaymentListQuery,
  calendarDateToApiDate,
} from '../../app/utils/payment-list-query';

function date(year: number, month: number, day: number) {
  return { year, month, day };
}

describe('payment-list-query', () => {
  it('calendarDateToApiDate formats YYYY-MM-DD', () => {
    expect(calendarDateToApiDate(date(2026, 3, 5))).toBe('2026-03-05');
    expect(calendarDateToApiDate(null)).toBeUndefined();
  });

  it('buildPaymentListQuery requires userId', () => {
    expect(
      buildPaymentListQuery({ type: 'operative', userId: null }),
    ).toBeNull();
  });

  it('buildPaymentListQuery maps operative filters', () => {
    expect(
      buildPaymentListQuery({
        type: 'operative',
        userId: 3,
        folio: ' R-1 ',
        fromDate: date(2026, 1, 10),
        toDate: date(2026, 2, 20),
      }),
    ).toEqual({
      operator: '3',
      folio: 'R-1',
      from_date: '2026-01-10',
      to_date: '2026-02-20',
    });
  });

  it('buildPaymentListQuery maps seller filters', () => {
    expect(
      buildPaymentListQuery({
        type: 'seller',
        userId: 8,
      }),
    ).toEqual({
      seller: '8',
    });
  });

  it('buildPaymentCartAddAllQuery adds all=true', () => {
    expect(
      buildPaymentCartAddAllQuery({
        type: 'seller',
        userId: 2,
        folio: 'ABC',
      }),
    ).toEqual({
      seller: '2',
      folio: 'ABC',
      all: 'true',
    });
  });
});
