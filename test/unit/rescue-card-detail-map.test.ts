import { describe, expect, it } from 'vitest';
import type { RescueCardDetail } from '~/interfaces/rescue/detail';
import { mapRescueCardDetailFromApi } from '~/utils/operational-rescue-detail';

const baseDetail: RescueCardDetail = {
  id: 1,
  folio: 'R-001',
  service_type: 'rescue',
  client_id: 10,
  client_name: 'Cliente',
  description: 'Falla de batería',
  service_description: '',
  location_description: '',
  sale_price: null,
  operative_status: 'approved',
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
};

describe('mapRescueCardDetailFromApi', () => {
  it('uses service_description when provided', () => {
    const mapped = mapRescueCardDetailFromApi({
      ...baseDetail,
      service_description: 'Cambio de llanta',
      location_description: 'Periférico Sur',
    });
    expect(mapped.service_description).toBe('Cambio de llanta');
    expect(mapped.location_description).toBe('Periférico Sur');
  });

  it('falls back description to service_description', () => {
    const mapped = mapRescueCardDetailFromApi({
      ...baseDetail,
      description: 'Falla de batería',
    });
    expect(mapped.service_description).toBe('Falla de batería');
    expect(mapped.location_description).toBe('');
  });
});
