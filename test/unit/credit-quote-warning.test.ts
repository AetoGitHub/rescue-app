import { describe, expect, it } from 'vitest';
import type { ClientCreditSnapshot } from '~/schemas/rescue-create';
import {
  getClientQuoteCreditWarning,
  quoteLinesHaveFilledEntries,
} from '~/utils/credit-quote-warning';
import type { RescueQuoteLine } from '~/interfaces/rescue';

const creditSnapshot: ClientCreditSnapshot = {
  client_type: 'CREDIT',
  credit_limit: '3000.00',
  credit_available: 3000,
};

function filledLine(): RescueQuoteLine {
  return {
    id: 'line-1',
    service_id: 1,
    service_label: 'Servicio',
    quantity: 1,
    unit_cost: 1000,
    contract_item_id: null,
    applied_price: 0,
  };
}

describe('getClientQuoteCreditWarning', () => {
  it('returns warning when CREDIT client exceeds available credit', () => {
    const warning = getClientQuoteCreditWarning(creditSnapshot, 12500, true);
    expect(warning).not.toBeNull();
    expect(warning?.title).toBe('Crédito insuficiente');
    expect(warning?.description).toContain('12,500');
    expect(warning?.description).toContain('3,000');
  });

  it('returns null when total is within available credit', () => {
    expect(getClientQuoteCreditWarning(creditSnapshot, 2500, true)).toBeNull();
  });

  it('returns null for non-credit clients', () => {
    expect(
      getClientQuoteCreditWarning(
        {
          client_type: 'CASH',
          credit_limit: null,
          credit_available: null,
        },
        12500,
        true,
      ),
    ).toBeNull();
  });

  it('returns null without filled lines or zero total', () => {
    expect(getClientQuoteCreditWarning(creditSnapshot, 0, false)).toBeNull();
    expect(getClientQuoteCreditWarning(creditSnapshot, 12500, false)).toBeNull();
  });
});

describe('quoteLinesHaveFilledEntries', () => {
  it('detects filled quote lines', () => {
    expect(quoteLinesHaveFilledEntries([filledLine()])).toBe(true);
    expect(
      quoteLinesHaveFilledEntries([
        {
          id: 'empty',
          service_id: null,
          service_label: '',
          quantity: 0,
          unit_cost: 0,
          contract_item_id: null,
          applied_price: 0,
        },
      ]),
    ).toBe(false);
  });
});
