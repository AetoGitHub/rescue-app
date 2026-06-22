import { describe, expect, it } from 'vitest';
import {
  buildPaymentCartAddAllQuery,
  buildPaymentListQuery,
  calendarDateToApiDate,
  paymentFilterToStatus,
  paymentStatusToFilterValue,
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

  it('buildPaymentListQuery omits payment by default (todos)', () => {
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

  it('buildPaymentListQuery maps seller filters without payment', () => {
    expect(
      buildPaymentListQuery({
        type: 'seller',
        userId: 8,
      }),
    ).toEqual({
      seller: '8',
    });
  });

  it('buildPaymentListQuery maps payment true and false', () => {
    expect(
      buildPaymentListQuery({
        type: 'operative',
        userId: 3,
        payment: true,
      }),
    ).toEqual({
      operator: '3',
      payment: 'true',
    });

    expect(
      buildPaymentListQuery({
        type: 'operative',
        userId: 3,
        payment: false,
      }),
    ).toEqual({
      operator: '3',
      payment: 'false',
    });
  });

  it('payment status helpers map UI values to query filter', () => {
    expect(paymentStatusToFilterValue('all')).toBeNull();
    expect(paymentStatusToFilterValue('paid')).toBe(true);
    expect(paymentStatusToFilterValue('pending')).toBe(false);
    expect(paymentFilterToStatus(null)).toBe('all');
    expect(paymentFilterToStatus(true)).toBe('paid');
    expect(paymentFilterToStatus(false)).toBe('pending');
  });

  it('buildPaymentCartAddAllQuery adds all=true', () => {
    expect(
      buildPaymentCartAddAllQuery({
        type: 'seller',
        userId: 2,
        folio: 'ABC',
        payment: false,
      }),
    ).toEqual({
      seller: '2',
      folio: 'ABC',
      payment: 'false',
      all: 'true',
    });
  });
});
