import { describe, expect, it } from 'vitest';
import {
  hydrateClientCreditDisplayWithoutLine,
  mapClientCreditInvoice,
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

  it('reads credit as numeric FK', () => {
    expect(resolveCreditId({ credit: 12 })).toBe(12);
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

  it('maps GET /api/credit/client/{id}/ payload', () => {
    const result = mapCreditDetail({
      id: 1,
      client_id: 2,
      limit: '50000.00',
      days: 30,
      extension: 15,
      remision_tolerance: 3,
      requires_purchase_order: false,
      is_blocked: false,
      is_active: true,
      created_at: '2026-05-19T20:48:52.246000Z',
      credit_used: '7551.60',
      credit_available: 42448.4,
      credit_info: {
        overdue: { amount: 0, count: 0 },
        upcoming: { amount: 0, count: 0 },
      },
    });

    expect(result.creditId).toBe(1);
    expect(result.summary.credit_used).toBe('7551.60');
    expect(result.summary.credit_available).toBe(42448.4);
    expect(result.form.extension).toBe(15);
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

  it('reads metrics from nested credit object', () => {
    const summary = mapClientCreditSummary({
      client_type: 'CREDIT',
      credit: {
        limit: '75000.00',
        credit_used: '1200.00',
        credit_available: 73800,
        credit_info: {
          overdue: { amount: 100, count: 1 },
          upcoming: { amount: 0, count: 0 },
        },
      },
    });

    expect(summary.credit_limit).toBe('75000.00');
    expect(summary.credit_used).toBe('1200.00');
    expect(summary.credit_available).toBe(73800);
    expect(summary.overdue_invoices_count).toBe(1);
  });
});

describe('hydrateClientCreditDisplayWithoutLine', () => {
  it('normalizes cash client without credit line', () => {
    const result = hydrateClientCreditDisplayWithoutLine(
      'CASH',
      {
        credit_limit: null,
        credit_used: '3654.00',
        credit_available: null,
        overdue_amount: 247136.27,
        overdue_invoices_count: 9,
        due_soon_amount: 29819.37,
        due_soon_invoices_count: 1,
      },
      {},
    );

    expect(result.summary.credit_limit).toBe('0.00');
    expect(result.summary.credit_used).toBe('3654.00');
    expect(result.summary.credit_available).toBe(-3654);
    expect(result.form.days).toBe(0);
  });
});

describe('mapClientCreditInvoice', () => {
  it('maps invoice fields with aliases', () => {
    const invoice = mapClientCreditInvoice({
      id: 10,
      folio: 'DEMO-0126',
      total: '6820.45',
      invoice_date: '2025-09-24',
      days_overdue: 245,
    });

    expect(invoice.id).toBe(10);
    expect(invoice.folio).toBe('DEMO-0126');
    expect(invoice.amount).toBe('6820.45');
    expect(invoice.billed_at).toBe('2025-09-24');
    expect(invoice.days_overdue).toBe(245);
  });
});
