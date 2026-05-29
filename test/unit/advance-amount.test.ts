import { describe, expect, it } from 'vitest';
import {
  computeAdvanceAmountFromPercent,
  formatAdvanceAmountForApi,
  formatAdvanceAmountForInput,
  getAdvancePercentPreview,
  parseAdvanceAmountValue,
} from '~/utils/advance-amount';
import {
  mapOperativeUpdateToApi,
  toOperativeUpdatePayload,
} from '~/utils/rescue-operative-api-map';
import type { RescueCardDetail } from '~/interfaces/rescue/detail';

describe('computeAdvanceAmountFromPercent', () => {
  it('rounds percent of quote total to nearest ten', () => {
    expect(computeAdvanceAmountFromPercent(1000, 25)).toBe(250);
    expect(computeAdvanceAmountFromPercent(100, 33)).toBe(40);
    expect(computeAdvanceAmountFromPercent(999, 50)).toBe(500);
  });

  it('returns 0 when quote total is zero', () => {
    expect(computeAdvanceAmountFromPercent(0, 50)).toBe(0);
  });
});

describe('formatAdvanceAmountForInput', () => {
  it('formats with two decimals', () => {
    expect(formatAdvanceAmountForInput(250)).toBe('250.00');
  });
});

describe('getAdvancePercentPreview', () => {
  it('formats rounded percent amount as card money', () => {
    expect(getAdvancePercentPreview(1000, 25)).toBe('$250');
  });
});

describe('parseAdvanceAmountValue', () => {
  it('parses formatted strings', () => {
    expect(parseAdvanceAmountValue('1,500.50')).toBe(1500.5);
  });
});

describe('formatAdvanceAmountForApi', () => {
  it('formats with two decimals for change_phase', () => {
    expect(formatAdvanceAmountForApi('500')).toBe('500.00');
  });
});

describe('mapOperativeUpdateToApi', () => {
  it('formats advance_amount on confirm advance', () => {
    expect(
      mapOperativeUpdateToApi({
        to: 'approved',
        advance_amount: '500',
        advance_date: '2026-05-28',
        advance_payment_method: 'transfer',
        advance_reference: 'REF-001',
      }),
    ).toEqual({
      to: 'approved',
      advance_amount: '500.00',
      advance_date: '2026-05-28',
      advance_payment_method: 'transfer',
      advance_reference: 'REF-001',
    });
  });
});

describe('toOperativeUpdatePayload request_advance', () => {
  const detail = {
    id: 1,
    service_type: 'rescue',
  } as RescueCardDetail;

  it('targets waiting_advance_payment with advance amount', () => {
    const body = toOperativeUpdatePayload('request_advance', detail, {
      advance: {
        advance_amount: '500',
        advance_date: '',
        advance_payment_method: '',
        advance_reference: '',
      },
    });
    expect(body).toEqual({
      to: 'waiting_advance_payment',
      advance_amount: '500',
    });
    expect(mapOperativeUpdateToApi(body)).toEqual({
      to: 'waiting_advance_payment',
      advance_amount: '500.00',
    });
  });
});

describe('toOperativeUpdatePayload approve_without_advance', () => {
  const detail = { id: 1, service_type: 'rescue' } as RescueCardDetail;

  it('only sends approved target phase', () => {
    expect(toOperativeUpdatePayload('approve_without_advance', detail)).toEqual({
      to: 'approved',
    });
  });
});

describe('toOperativeUpdatePayload confirm_advance_received', () => {
  const detail = { id: 1, service_type: 'rescue' } as RescueCardDetail;

  it('includes payment fields for approved phase', () => {
    expect(
      toOperativeUpdatePayload('confirm_advance_received', detail, {
        advance: {
          advance_amount: '500.00',
          advance_date: '2026-05-28',
          advance_payment_method: 'transfer',
          advance_reference: 'REF-001',
        },
      }),
    ).toEqual({
      to: 'approved',
      advance_amount: '500.00',
      advance_date: '2026-05-28',
      advance_payment_method: 'transfer',
      advance_reference: 'REF-001',
    });
  });
});
