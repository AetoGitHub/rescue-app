import { describe, expect, it } from 'vitest';
import type { RescueCardDetail } from '~/interfaces/rescue/detail';
import {
  canEditRescueQuote,
  canEditRescueQuoteWithUnlock,
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
    service_description: '',
    location_description: '',
    sale_price: null,
    operator_id: null,
    operator_name: null,
    supplier_id: null,
    supplier_name: null,
    multiple_managers: false,
    sub_total: null,
    admin_status: 'invalid',
    created_at: '2026-01-01T00:00:00Z',
    phase_started_at: '2026-01-01T00:00:00Z',
    unlocked_until: null,
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

  it('canEditRescueQuoteWithUnlock allows terminal status with unlock session', () => {
    const detail = minimalDetail({
      operative_status: 'closed',
      sub_total: '1500.00',
    });
    expect(canEditRescueQuoteWithUnlock(detail, null)).toBe(false);
    expect(
      canEditRescueQuoteWithUnlock(detail, '2026-06-10T18:00:00.000Z'),
    ).toBe(true);
  });

  it('canEditRescueQuoteWithUnlock keeps non-terminal edit without session', () => {
    const detail = minimalDetail({
      operative_status: 'in_progress',
      sub_total: '1500.00',
    });
    expect(canEditRescueQuoteWithUnlock(detail, null)).toBe(true);
  });
});
