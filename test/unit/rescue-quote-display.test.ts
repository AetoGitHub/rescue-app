import { describe, expect, it } from 'vitest';
import { summarizeRescueQuoteDetail } from '~/utils/rescue-quote-display';

describe('summarizeRescueQuoteDetail', () => {
  it('derives ganancia and IVA amount from stored quote totals', () => {
    const summary = summarizeRescueQuoteDetail({
      technical_cost: '1000.00',
      sub_total: '1600.00',
      total: '1856.00',
      iva: 16,
      comissions_apply: '50.00',
    });

    expect(summary.technicalCost).toBe(1000);
    expect(summary.subTotal).toBe(1600);
    expect(summary.profit).toBe(600);
    expect(summary.commissions).toBe(50);
    expect(summary.ivaPercent).toBe(16);
    expect(summary.ivaAmount).toBe(256);
    expect(summary.total).toBe(1856);
  });

  it('handles zero or empty commission', () => {
    const summary = summarizeRescueQuoteDetail({
      technical_cost: '500',
      sub_total: '500',
      total: '500',
      iva: 0,
      comissions_apply: '',
    });

    expect(summary.profit).toBe(0);
    expect(summary.commissions).toBe(0);
    expect(summary.ivaAmount).toBe(0);
  });
});
