import { describe, expect, it } from 'vitest';
import type { RescueCardDetail } from '~/interfaces/rescue/detail';
import {
  canEditRescueQuote,
  hasRescueQuoteOnDetail,
} from '~/utils/rescue-quote-tab';

function minimalDetail(
  partial: Partial<RescueCardDetail> & Pick<RescueCardDetail, 'operative_status'>,
): RescueCardDetail {
  return {
    id: 1,
    folio: 'R-001',
    service_type: 'rescue',
    client_id: 10,
    client_name: 'Cliente',
    description: '',
    sale_price: null,
    operative_status: partial.operative_status,
    operator_id: null,
    operator_name: null,
    supplier_id: null,
    supplier_name: null,
    multiple_managers: false,
    sub_total: null,
    admin_status: 'invalid',
    created_at: '2026-01-01T00:00:00Z',
    phase_started_at: '2026-01-01T00:00:00Z',
    client_type: 'CASH',
    client_phone: null,
    seller_id: null,
    seller_name: null,
    vehicle: null,
    provider_cost: null,
    net_profit: null,
    supplier_score: null,
    latitude: null,
    longitude: null,
    ...partial,
  };
}

describe('rescue quote detail tab helpers', () => {
  it('canEditRescueQuote for non-terminal operative statuses', () => {
    const detail = minimalDetail({
      operative_status: 'active_without_quote',
      sub_total: '1500.00',
    });
    expect(canEditRescueQuote(detail)).toBe(true);
    expect(hasRescueQuoteOnDetail(detail)).toBe(true);
  });

  it('cannot edit in terminal statuses even with quote', () => {
    for (const status of ['closed', 'closed_unpaid', 'canceled'] as const) {
      const detail = minimalDetail({
        operative_status: status,
        sub_total: '1500.00',
      });
      expect(canEditRescueQuote(detail)).toBe(false);
    }
  });

  it('hasRescueQuoteOnDetail when sub_total is set', () => {
    const detail = minimalDetail({
      operative_status: 'pending_authorization',
      sub_total: '1500.00',
    });
    expect(hasRescueQuoteOnDetail(detail)).toBe(true);
    expect(canEditRescueQuote(detail)).toBe(true);
  });

  it('hasRescueQuoteOnDetail when quote_count is positive', () => {
    const detail = minimalDetail({
      operative_status: 'approved',
      quote_count: 2,
      sub_total: null,
    });
    expect(hasRescueQuoteOnDetail(detail)).toBe(true);
    expect(canEditRescueQuote(detail)).toBe(true);
  });
});
