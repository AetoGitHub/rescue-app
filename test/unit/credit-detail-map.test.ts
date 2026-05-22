import { describe, expect, it } from 'vitest';
import {
  mapCreditDetail,
  mapClientCreditSummary,
  resolveCreditId,
} from '../../app/utils/catalog-detail-map';

describe('resolveCreditId', () => {
  it('reads credit_id from client detail', () => {
    expect(resolveCreditId({ credit_id: 5 })).toBe(5);
  });

  it('reads nested credit.id', () => {
    expect(resolveCreditId({ credit: { id: 7 } })).toBe(7);
  });

  it('reads id from credit detail payload', () => {
    expect(
      resolveCreditId({
        id: 1,
        client_id: 2,
        limit: '50000.00',
        credit_used: '0.00',
      }),
    ).toBe(1);
  });

  it('returns null when missing', () => {
    expect(resolveCreditId({ name: 'Test' })).toBeNull();
  });
});

describe('mapCreditDetail', () => {
  it('maps form, summary and credit_info buckets', () => {
    const result = mapCreditDetail({
      id: 1,
      client_id: 2,
      limit: '50000.00',
      days: 30,
      extension: 15,
      remision_tolerance: 3,
      requires_purchase_order: false,
      is_blocked: false,
      credit_used: '1000.00',
      credit_available: 49000,
      credit_info: {
        overdue: { amount: 150.5, count: 2 },
        upcoming: { amount: 80, count: 1 },
      },
    });

    expect(result.creditId).toBe(1);
    expect(result.form.limit).toBe('50000.00');
    expect(result.form.days).toBe(30);
    expect(result.summary.credit_available).toBe(49000);
    expect(result.summary.overdue_amount).toBe(150.5);
    expect(result.summary.overdue_invoices_count).toBe(2);
    expect(result.summary.due_soon_amount).toBe(80);
    expect(result.summary.due_soon_invoices_count).toBe(1);
  });
});

describe('mapClientCreditSummary', () => {
  it('reads credit_info from nested client payload', () => {
    const summary = mapClientCreditSummary({
      credit_limit: '10000.00',
      credit_used: '500.00',
      credit_available: 9500,
      credit_info: {
        overdue: { amount: 0, count: 0 },
        upcoming: { amount: 25, count: 1 },
      },
    });

    expect(summary.due_soon_amount).toBe(25);
    expect(summary.due_soon_invoices_count).toBe(1);
  });
});
