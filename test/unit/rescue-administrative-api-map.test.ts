import { describe, expect, it } from 'vitest';
import {
  administrativeDetailToCardDetail,
  mapAdministrativeCardFromApi,
  mapAdministrativeChangeAdminStatusToApi,
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

  it('maps net_profit from administrative cards list payload', () => {
    const card = mapAdministrativeCardFromApi({
      id: 14,
      folio: 'RES-2026-00014',
      service_type: 'rescue',
      client_id: 2,
      client_name: 'CLIENTE CON CREDITO',
      client_billing_type: 'DIRECT_INVOICE',
      supplier_id: 2,
      supplier_name: 'REMOLQUES EL MENO',
      sub_total: '110.00',
      net_profit: '106.00',
      created_at: '2026-06-01T20:07:18.033462Z',
      unlocked_until: null,
    });
    expect(card.sub_total).toBe('110.00');
    expect(card.sale_price).toBe('110.00');
    expect(card.net_profit).toBe('106.00');
  });

  it('falls back to provider_profit for net_profit', () => {
    const card = mapAdministrativeCardFromApi({
      id: 5,
      folio: 'R-005',
      provider_profit: '90.50',
      operative_status: 'closed',
    });
    expect(card.net_profit).toBe('90.50');
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
    expect(detail.unlocked_until).toBeNull();
  });

  it('maps unlocked_until on detail and administrative card detail bridge', () => {
    const detail = mapAdministrativeDetailFromApi({
      ...ADMINISTRATIVE_DETAIL_API_EXAMPLE,
      unlocked_until: '2026-06-10T18:00:00Z',
    });
    expect(detail.unlocked_until).toBe('2026-06-10T18:00:00Z');

    const cardDetail = administrativeDetailToCardDetail(detail);
    expect(cardDetail.unlocked_until).toBe('2026-06-10T18:00:00Z');
  });

  it('maps client_billing_type from API field', () => {
    const detail = mapAdministrativeDetailFromApi({
      id: 3,
      folio: 'R-003',
      client_type: 'CREDIT',
      client_billing_type: 'REMISSION',
      operative_status: 'closed',
      admin_status: 'unattended',
    });
    expect(detail.client_billing_type).toBe('REMISSION');
    expect(detail.requires_remision).toBe(true);
  });

  it('falls back to billing_type when client_billing_type is absent', () => {
    const detail = mapAdministrativeDetailFromApi({
      id: 3,
      folio: 'R-003',
      client_type: 'CREDIT',
      billing_type: 'MANUAL',
      operative_status: 'closed',
      admin_status: 'unattended',
    });
    expect(detail.client_billing_type).toBe('MANUAL');
    expect(detail.requires_remision).toBe(true);
  });

  it('defaults to DIRECT_INVOICE and no remision when billing type missing', () => {
    const detail = mapAdministrativeDetailFromApi({
      id: 14,
      folio: 'RES-2026-00014',
      client_type: 'CREDIT',
      operative_status: 'closed',
      admin_status: 'unattended',
    });
    expect(detail.client_billing_type).toBe('DIRECT_INVOICE');
    expect(detail.requires_remision).toBe(false);
  });

  it('does not require remision for DIRECT_INVOICE billing', () => {
    const detail = mapAdministrativeDetailFromApi({
      id: 15,
      folio: 'R-015',
      client_billing_type: 'DIRECT_INVOICE',
      operative_status: 'closed',
      admin_status: 'unattended',
    });
    expect(detail.requires_remision).toBe(false);
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

describe('mapAdministrativeChangeAdminStatusToApi', () => {
  it('maps remittance transition', () => {
    const api = mapAdministrativeChangeAdminStatusToApi({
      billing_status: 'in_remittance',
      remittance_number: 'REM-2026-001',
    });
    expect(api).toEqual({
      to: 'in_remittance',
      remittance_folio: 'REM-2026-001',
    });
  });

  it('maps invoice transition with notes', () => {
    const api = mapAdministrativeChangeAdminStatusToApi({
      billing_status: 'invoiced',
      invoice_number: 'FAC-2026-042',
      invoice_date: '2026-06-01',
      invoice_amount: '1044.00',
      invoice_notes: '',
    });
    expect(api).toEqual({
      to: 'invoiced',
      invoice_folio: 'FAC-2026-042',
      invoice_date: '2026-06-01',
      invoiced_amount: '1044.00',
      notes: '',
    });
  });

  it('maps apply payment with evidence url only', () => {
    const api = mapAdministrativeChangeAdminStatusToApi({
      billing_status: 'paid',
      payment_evidence_url: 'https://ejemplo.com/comprobante.pdf',
    });
    expect(api).toEqual({
      to: 'paid',
      payment_evidence_url: 'https://ejemplo.com/comprobante.pdf',
    });
  });

  it('maps admin cancel with cancellation_reason', () => {
    const api = mapAdministrativeChangeAdminStatusToApi({
      billing_status: 'canceled',
      admin_cancellation_reason: 1,
    });
    expect(api).toEqual({
      to: 'canceled',
      cancellation_reason: 1,
    });
  });
});

describe('mapAdministrativeUpdateToApi', () => {
  it('uses change_admin_status shape for phase transitions', () => {
    const api = mapAdministrativeUpdateToApi({
      billing_status: 'paid',
      payment_evidence_url: 'https://example.com/p.pdf',
    });
    expect(api.to).toBe('paid');
    expect(api.admin_status).toBeUndefined();
  });

  it('uses legacy shape for purchase order only', () => {
    const api = mapAdministrativeUpdateToApi({
      purchase_order_number: 'OC-123',
    });
    expect(api).toEqual({ purchase_order_number: 'OC-123' });
    expect(api.to).toBeUndefined();
  });
});

describe('toAdministrativeUpdatePayload', () => {
  it('maps apply payment with payment_evidence_url', () => {
    const body = toAdministrativeUpdatePayload('apply_payment', {
      payment: {
        payment_evidence_url: 'https://ejemplo.com/comprobante.pdf',
      },
    });
    expect(body.billing_status).toBe('paid');
    expect(body.payment_evidence_url).toBe(
      'https://ejemplo.com/comprobante.pdf',
    );
    expect(mapAdministrativeChangeAdminStatusToApi(body).to).toBe('paid');
  });

  it('maps open warranty without operative_status', () => {
    const body = toAdministrativeUpdatePayload('open_warranty');
    expect(body.billing_status).toBe('warranty');
    expect(mapAdministrativeChangeAdminStatusToApi(body)).toEqual({
      to: 'warranty',
    });
  });
});

describe('targetBillingStatusForAction', () => {
  it('returns invoiced for register_invoice', () => {
    expect(targetBillingStatusForAction('register_invoice')).toBe('invoiced');
  });
});
