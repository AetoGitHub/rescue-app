import { describe, expect, it } from 'vitest';
import { mapGuestRescueDetailFromApproveApi } from '~/utils/rescue-guest-detail-map';

describe('mapGuestRescueDetailFromApproveApi', () => {
  it('maps flat guest card detail payload', () => {
    const mapped = mapGuestRescueDetailFromApproveApi({
      id: 44,
      folio: 'RES-2026-00044',
      service_type: 'rescue',
      client_id: 2,
      client_name: 'CLIENTE CON CREDITO',
      client_billing_type: 'DIRECT_INVOICE',
      location_description:
        'Ciudad De México, Centro Histórico de la Cdad. de México, Centro, 06060 Ciudad de México, CDMX, México',
      service_description: '',
      sale_price: null,
      operative_status: 'pending_authorization',
      operator_id: 42,
      operator_name: 'TEST TEST',
      supplier_id: null,
      supplier_name: '',
      multiple_managers: false,
      sub_total: '10.00',
      admin_status: 'invalid',
      created_at: '2026-07-03T20:06:24.109184Z',
      phase_started_at: '2026-07-03T20:06:24.814661Z',
      last_comment_at: null,
      unlocked_until: null,
      client_type: 'CREDIT',
      client_phone: '12 3456 789',
      seller_id: 51,
      seller_name: 'SELLERCITO SELLERSOTE',
      vehicle: null,
      provider_cost: '1.00',
      net_profit: '9.00',
      supplier_score: null,
      latitude: '19.432520',
      longitude: '-99.132299',
    });

    expect(mapped.id).toBe(44);
    expect(mapped.folio).toBe('RES-2026-00044');
    expect(mapped.client_name).toBe('CLIENTE CON CREDITO');
    expect(mapped.operative_status).toBe('pending_authorization');
    expect(mapped.location_description).toContain('Ciudad de México');
  });

  it('maps nested rescue payload', () => {
    const mapped = mapGuestRescueDetailFromApproveApi({
      rescue: {
        id: 7,
        folio: 'R-007',
        service_type: 'rescue',
        client_id: 1,
        client_name: 'Cliente',
        service_description: 'Desc',
        location_description: 'Loc',
        sale_price: null,
        operative_status: 'pending_authorization',
        operator_id: null,
        operator_name: null,
        supplier_id: null,
        supplier_name: null,
        multiple_managers: false,
        sub_total: '1000',
        admin_status: 'working',
        created_at: '2026-01-01T00:00:00Z',
        phase_started_at: '2026-01-01T00:00:00Z',
        unlocked_until: null,
        client_type: 'PUBLIC',
        client_phone: null,
        seller_id: null,
        seller_name: null,
        vehicle: null,
        provider_cost: null,
        net_profit: null,
        supplier_score: null,
        latitude: null,
        longitude: null,
      },
    });

    expect(mapped.id).toBe(7);
    expect(mapped.folio).toBe('R-007');
    expect(mapped.service_description).toBe('Desc');
  });

  it('throws on invalid payload', () => {
    expect(() => mapGuestRescueDetailFromApproveApi(null)).toThrow(
      'Respuesta de autorización inválida',
    );
  });
});
