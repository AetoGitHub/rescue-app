import { describe, expect, it } from 'vitest';
import type { RescueCardDetail } from '../../app/interfaces/rescue/detail';
import { rescueAuthorizerContactCreateSchema } from '../../app/schemas/rescue-authorizer-assign';
import { canAssignRescueAuthorizerWithUnlock } from '../../app/utils/rescue-authorizer-assign';

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
    authorizer_id: null,
    authorizer_name: null,
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
    technical_cost: null,
    net_profit: null,
    supplier_score: null,
    latitude: null,
    longitude: null,
    ...partial,
  };
}

describe('rescueAuthorizerContactCreateSchema email', () => {
  const emailField = rescueAuthorizerContactCreateSchema.shape.email;

  it('accepts a blank email', () => {
    expect(emailField.safeParse('').success).toBe(true);
    expect(emailField.safeParse('  ').success).toBe(true);
  });

  it('still rejects a malformed email', () => {
    expect(emailField.safeParse('not-an-email').success).toBe(false);
  });

  it('accepts a valid email', () => {
    expect(emailField.safeParse('a@b.com').success).toBe(true);
  });
});

describe('canAssignRescueAuthorizerWithUnlock', () => {
  it('blocks terminal statuses without an unlock session', () => {
    const detail = minimalDetail({ operative_status: 'closed_unpaid' });
    expect(canAssignRescueAuthorizerWithUnlock(detail, null)).toBe(false);
  });

  it('allows terminal statuses with an active unlock session', () => {
    const detail = minimalDetail({ operative_status: 'closed_unpaid' });
    expect(
      canAssignRescueAuthorizerWithUnlock(detail, '2026-06-10T18:00:00.000Z'),
    ).toBe(true);
  });

  it('always allows superusers, even in terminal status without a session', () => {
    const detail = minimalDetail({ operative_status: 'closed' });
    expect(canAssignRescueAuthorizerWithUnlock(detail, null, true)).toBe(true);
  });

  it('keeps non-terminal status assignable without a session', () => {
    const detail = minimalDetail({ operative_status: 'in_progress' });
    expect(canAssignRescueAuthorizerWithUnlock(detail, null)).toBe(true);
  });
});
