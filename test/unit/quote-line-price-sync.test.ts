import { describe, expect, it } from 'vitest';
import type { RescueQuoteLine } from '~/interfaces/rescue';
import { catalogDropdownSelection } from '~/interfaces/shared/catalog-dropdown.interface';
import {
  applyAppliedPriceOverride,
  applyClientPriceOverride,
  resetQuoteLinePriceOverrides,
  syncQuoteLinePricesFromCalculated,
} from '~/utils/quote-line-price-sync';
import { emptyQuoteLinePriceFields } from '~/utils/rescue-quote-lines';

const user = { id: 7, name: 'operador' };

function line(
  partial: Partial<RescueQuoteLine> & Pick<RescueQuoteLine, 'quantity' | 'unit_cost'>,
): RescueQuoteLine {
  return {
    id: 'line-1',
    service: catalogDropdownSelection(1, 'Servicio'),
    quantity: partial.quantity,
    unit_cost: partial.unit_cost,
    contract_item_id: null,
    ...emptyQuoteLinePriceFields(),
    ...partial,
  };
}

describe('quote line price sync', () => {
  it('divides applied total by quantity for venta AETO (3 × 360 → 2000)', () => {
    const row = line({ quantity: 3, unit_cost: 360 });
    applyAppliedPriceOverride(row, 2000, 1080, user);

    expect(row.applied_price).toBe(2000);
    expect(row.client_price).toBe(666.67);
    expect(row.priceOverrideSource).toBe('applied_price');
    expect(row.blame_applied_price).toEqual({
      original: '1080.00',
      user_id: 7,
      username: 'operador',
    });
    expect(row.blame_client_price).toBeNull();
  });

  it('multiplies venta AETO by quantity for applied total', () => {
    const row = line({ quantity: 3, unit_cost: 360 });
    applyClientPriceOverride(row, 500, 360, user);

    expect(row.client_price).toBe(500);
    expect(row.applied_price).toBe(1500);
    expect(row.priceOverrideSource).toBe('client_price');
    expect(row.blame_client_price).toEqual({
      original: '360.00',
      user_id: 7,
      username: 'operador',
    });
    expect(row.blame_applied_price).toBeNull();
  });

  it('does not overwrite original blame on a second explicit edit', () => {
    const row = line({ quantity: 3, unit_cost: 360 });
    applyAppliedPriceOverride(row, 2000, 1080, user);
    applyAppliedPriceOverride(row, 2100, 1188, user);

    expect(row.applied_price).toBe(2100);
    expect(row.blame_applied_price?.original).toBe('1080.00');
  });

  it('reset restores initializer and clears blame', () => {
    const row = line({ quantity: 3, unit_cost: 360 });
    applyAppliedPriceOverride(row, 2000, 1080, user);
    resetQuoteLinePriceOverrides(row, 1080, 360);

    expect(row.priceOverrideSource).toBe('none');
    expect(row.applied_price).toBe(1080);
    expect(row.client_price).toBe(360);
    expect(row.blame_applied_price).toBeNull();
    expect(row.blame_client_price).toBeNull();
  });

  it('follows calculated values when there is no override', () => {
    const row = line({ quantity: 3, unit_cost: 360 });
    syncQuoteLinePricesFromCalculated(row, 1080, 360, undefined);
    expect(row.applied_price).toBe(1080);
    expect(row.client_price).toBe(360);

    syncQuoteLinePricesFromCalculated(row, 1188, 396, 1080);
    expect(row.applied_price).toBe(1188);
    expect(row.client_price).toBe(396);
    expect(row.priceOverrideSource).toBe('none');
  });

  it('does not move convenio AETO when only unit_cost changes', () => {
    const row = line({
      quantity: 3,
      unit_cost: 500,
      contract_item_id: 10,
      client_price: 500,
      applied_price: 1500,
    });

    row.unit_cost = 300;
    syncQuoteLinePricesFromCalculated(row, 1500, 500, 1500);

    expect(row.client_price).toBe(500);
    expect(row.applied_price).toBe(1500);
    expect(row.priceOverrideSource).toBe('none');
  });

  it('keeps applied total and back-fills AETO when quantity changes after applied override', () => {
    const row = line({ quantity: 3, unit_cost: 360 });
    applyAppliedPriceOverride(row, 2000, 1080, user);
    row.quantity = 4;
    syncQuoteLinePricesFromCalculated(row, 1440, 360, 1080);

    expect(row.applied_price).toBe(2000);
    expect(row.client_price).toBe(500);
  });
});
