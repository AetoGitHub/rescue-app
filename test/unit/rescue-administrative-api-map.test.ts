import { describe, expect, it } from 'vitest';
import {
  administrativeDetailToCardDetail,
  mapAdministrativeCardFromApi,
  mapAdministrativeDetailFromApi,
  mapAdministrativeUpdateToApi,
  targetBillingStatusForAction,
  toAdministrativeUpdatePayload,
  unwrapAdministrativeDetailRecord,
} from '~/utils/rescue-administrative-api-map';

describe('mapAdministrativeCardFromApi', () => {
  it('maps admin_status to billing_status', () => {
    const card = mapAdministrativeCardFromApi({
      id: 1,
      folio: 'R-001',
      admin_status: 'invoiced',
      operative_status: 'closed',
      client_name: 'Acme',
      sub_total: '1500.00',
      description: 'Ubicación',
      multiple_managers: false,
      created_at: '2026-06-01T10:00:00Z',
      phase_started_at: '2026-06-02T08:00:00Z',
    });
    expect(card.billing_status).toBe('invoiced');
    expect(card.sale_price).toBe('1500.00');
    expect(card.sub_total).toBe('1500.00');
    expect(card.net_profit).toBeNull();
    expect(card.service_date).toBe('2026-06-02T08:00:00Z');
    expect(card.description).toBe('Ubicación');
  });

  it('maps legacy admin_canceled to canceled', () => {
    const card = mapAdministrativeCardFromApi({
      id: 2,
      folio: 'R-002',
      admin_status: 'admin_canceled',
      operative_status: 'closed',
    });
    expect(card.billing_status).toBe('canceled');
  });

  it('maps invalid admin_status', () => {
    const card = mapAdministrativeCardFromApi({
      id: 4,
      folio: 'R-004',
      admin_status: 'invalid',
      operative_status: 'closed',
    });
    expect(card.billing_status).toBe('invalid');
  });

  it('defaults billing status to unattended', () => {
    const card = mapAdministrativeCardFromApi({
      id: 3,
      folio: 'R-003',
      operative_status: 'closed',
    });
    expect(card.billing_status).toBe('unattended');
  });
});

const ADMINISTRATIVE_DETAIL_API_EXAMPLE = {
  id: 14,
  folio: 'RES-2026-00014',
  service_type: 'rescue',
  client_id: 2,
  client_name: 'CLIENTE CON CREDITO',
  description: 'xxx',
  sale_price: null,
  operative_status: 'closed',
  admin_status: 'unattended',
  operator_id: 2,
  operator_name: 'Estrella Cruz',
  supplier_id: 2,
  supplier_name: 'REMOLQUES EL MENO',
  multiple_managers: false,
  sub_total: '110.00',
  created_at: '2026-06-01T20:07:18.033462Z',
  phase_started_at: '2026-06-02T21:45:10.018954Z',
  last_comment_at: '2026-06-01T20:07:40.482934Z',
  unlocked_until: null,
  client_type: 'CREDIT',
  client_phone: '12 3456 789',
  seller_id: 1,
  seller_name: 'Osvaldo Valentin Garcia',
  vehicle: null,
  provider_cost: '4.00',
  net_profit: '106.00',
  supplier_score: null,
  latitude: '19.435861',
  longitude: '-99.143275',
} as const;

describe('mapAdministrativeDetailFromApi', () => {
  it('maps administrative detail endpoint example payload', () => {
    const detail = mapAdministrativeDetailFromApi({
      ...ADMINISTRATIVE_DETAIL_API_EXAMPLE,
    });
    expect(detail.id).toBe(14);
    expect(detail.folio).toBe('RES-2026-00014');
    expect(detail.billing_status).toBe('unattended');
    expect(detail.client_type).toBe('CREDIT');
    expect(detail.sale_price).toBe('110.00');
    expect(detail.sub_total).toBe('110.00');
    expect(detail.net_profit).toBe('106.00');
    expect(detail.provider_cost).toBe('4.00');
    expect(detail.seller_name).toBe('Osvaldo Valentin Garcia');
    expect(detail.latitude).toBe('19.435861');
    expect(detail.longitude).toBe('-99.143275');
  });

  it('derives requires_remision for credit clients', () => {
    const detail = mapAdministrativeDetailFromApi({
      id: 3,
      folio: 'R-003',
      client_type: 'CREDIT',
      billing_type: 'MANUAL',
      operative_status: 'closed',
      admin_status: 'unattended',
    });
    expect(detail.requires_remision).toBe(true);
  });

  it('derives requires_remision for credit without billing_type', () => {
    const detail = mapAdministrativeDetailFromApi({
      id: 14,
      folio: 'RES-2026-00014',
      client_type: 'CREDIT',
      operative_status: 'closed',
      admin_status: 'unattended',
    });
    expect(detail.requires_remision).toBe(true);
  });

  it('unwraps nested data envelope', () => {
    const detail = mapAdministrativeDetailFromApi(
      unwrapAdministrativeDetailRecord({
        data: {
          id: 9,
          folio: 'R-009',
          admin_status: 'paid',
          operative_status: 'closed',
        },
      }),
    );
    expect(detail.id).toBe(9);
    expect(detail.billing_status).toBe('paid');
  });
});

describe('administrativeDetailToCardDetail', () => {
  it('maps fields for operational general tab', () => {
    const detail = mapAdministrativeDetailFromApi({
      id: 1,
      folio: 'R-1',
      admin_status: 'unattended',
      operative_status: 'closed',
      client_type: 'CREDIT',
      latitude: '19.1',
      longitude: '-99.1',
      provider_cost: '10',
      net_profit: '90',
    });
    const card = administrativeDetailToCardDetail(detail);
    expect(card.latitude).toBe('19.1');
    expect(card.net_profit).toBe('90');
  });
});

describe('mapAdministrativeUpdateToApi', () => {
  it('sends admin_status instead of billing_status', () => {
    const api = mapAdministrativeUpdateToApi({
      billing_status: 'paid',
      operative_status: 'closed',
    });
    expect(api.admin_status).toBe('paid');
    expect(api.billing_status).toBeUndefined();
    expect(api.operative_status).toBe('closed');
  });
});

describe('toAdministrativeUpdatePayload', () => {
  it('maps apply payment with closed_at', () => {
    const body = toAdministrativeUpdatePayload('apply_payment', {
      payment: {
        payment_amount: '1000',
        payment_date: '2026-06-02',
        payment_method: 'cash',
        payment_reference: '',
      },
      closedAt: '2026-06-02',
    });
    expect(body.billing_status).toBe('paid');
    expect(body.closed_at).toBe('2026-06-02');
    expect(mapAdministrativeUpdateToApi(body).admin_status).toBe('paid');
  });

  it('maps open warranty to operative warranty_pending', () => {
    const body = toAdministrativeUpdatePayload('open_warranty');
    expect(body.billing_status).toBe('warranty');
    expect(mapAdministrativeUpdateToApi(body).admin_status).toBe('warranty');
    expect(body.operative_status).toBe('warranty_pending');
  });
});

describe('targetBillingStatusForAction', () => {
  it('returns invoiced for register_invoice', () => {
    expect(targetBillingStatusForAction('register_invoice')).toBe('invoiced');
  });
});
