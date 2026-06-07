import { describe, expect, it } from 'vitest';
import { resolveClientLoanMarginPercent } from '~/utils/catalog-detail-map';

describe('resolveClientLoanMarginPercent', () => {
  it('maps percent from top-level field', () => {
    expect(
      resolveClientLoanMarginPercent({
        loan_margin: '20',
      }),
    ).toBe(20);
    expect(
      resolveClientLoanMarginPercent({
        loan_margin_percent: '15.5%',
      }),
    ).toBe(15.5);
  });

  it('maps percent from nested credit object', () => {
    expect(
      resolveClientLoanMarginPercent({
        credit: {
          margin_loan: 25,
        },
      }),
    ).toBe(25);
  });

  it('prefers top-level value over nested credit', () => {
    expect(
      resolveClientLoanMarginPercent({
        loan_margin: 10,
        credit: {
          loan_margin: 30,
        },
      }),
    ).toBe(10);
  });

  it('returns null when field is missing or invalid', () => {
    expect(resolveClientLoanMarginPercent({})).toBeNull();
    expect(
      resolveClientLoanMarginPercent({
        loan_margin: '',
        credit: { prestamo_margin: 'invalid' },
      }),
    ).toBeNull();
  });
});
