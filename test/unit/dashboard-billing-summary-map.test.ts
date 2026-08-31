import { describe, expect, it } from 'vitest';
import {
  EMPTY_DASHBOARD_BILLING_SUMMARY,
  mapAdministrativeCardsSummary,
  mapDashboardBillingSummary,
} from '../../app/utils/dashboard-billing-summary-map';

describe('mapDashboardBillingSummary', () => {
  it('maps count and sub_total from the backend contract', () => {
    expect(
      mapDashboardBillingSummary({
        count: 42,
        sub_total: '1500.50',
        total: '1740.58',
        net_profit: '200',
      }),
    ).toEqual({
      count: 42,
      sub_total: 1500.5,
      total: 1740.58,
      net_profit: 200,
    });
  });

  it('accepts subtotal as a legacy alias of sub_total', () => {
    expect(
      mapDashboardBillingSummary({
        count: '3',
        subtotal: '1000',
      }),
    ).toMatchObject({
      count: 3,
      sub_total: 1000,
    });
  });

  it('prefers sub_total when both aliases are present', () => {
    expect(
      mapDashboardBillingSummary({
        count: 1,
        sub_total: 80,
        subtotal: 10,
      }).sub_total,
    ).toBe(80);
  });

  it('returns zeros for missing or invalid payloads', () => {
    expect(mapDashboardBillingSummary(null)).toEqual(
      EMPTY_DASHBOARD_BILLING_SUMMARY,
    );
    expect(mapDashboardBillingSummary({})).toEqual(
      EMPTY_DASHBOARD_BILLING_SUMMARY,
    );
    expect(mapDashboardBillingSummary({ count: -4 }).count).toBe(0);
  });
});

describe('mapAdministrativeCardsSummary', () => {
  it('exposes count and mirrors sub_total as subtotal', () => {
    expect(
      mapAdministrativeCardsSummary({
        count: 7,
        sub_total: '250.00',
        total: '290.00',
        net_profit: '40',
      }),
    ).toEqual({
      count: 7,
      sub_total: 250,
      subtotal: 250,
      total: 290,
      net_profit: 40,
    });
  });
});
