import { describe, expect, it } from 'vitest';
import type { RescueQuoteLine } from '~/interfaces/rescue';
import { emptyCatalogDropdownSelection } from '~/interfaces/shared/catalog-dropdown.interface';
import {
  applyContractToLine,
  dedupeContractItemsByService,
  findContractItemForService,
  mapRescueCompanySettings,
} from '~/utils/rescue-company-settings';

const contractItem = {
  id: 10,
  service_id: 3,
  service_name: 'Servicio convenio',
  price: 500,
  price_multiplier: 1,
  percentaje: 0,
  notes: '',
};

function quoteLine(
  partial: Partial<RescueQuoteLine> = {},
): RescueQuoteLine {
  return {
    id: 'line-1',
    service: emptyCatalogDropdownSelection(),
    quantity: 1,
    unit_cost: 0,
    contract_item_id: null,
    applied_price: 0,
    ...partial,
  };
}

describe('dedupeContractItemsByService', () => {
  it('keeps the first item per service_id', () => {
    const items = dedupeContractItemsByService([
      {
        id: 10,
        service_id: 1,
        service_name: 'Grúa plana',
        price: 500,
        price_multiplier: 1,
        percentaje: 0,
        notes: '',
      },
      {
        id: 11,
        service_id: 1,
        service_name: 'Grúa plana premium',
        price: 750,
        price_multiplier: 1.5,
        percentaje: 10,
        notes: 'Ignorado',
      },
      {
        id: 20,
        service_id: 2,
        service_name: 'Otro',
        price: 100,
        price_multiplier: 1,
        percentaje: 0,
        notes: '',
      },
    ]);

    expect(items).toHaveLength(2);
    expect(items[0]!.id).toBe(10);
    expect(items[0]!.price).toBe(500);
    expect(items[1]!.service_id).toBe(2);
  });
});

describe('mapRescueCompanySettings', () => {
  it('dedupes duplicate contract items from API payload', () => {
    const settings = mapRescueCompanySettings({
      commissions: {
        commission_type: 'PERCENTAGE',
        commission_value: 0,
        commission_fixed: 0,
        price_multiplier: 1,
        loan_multiplier: 1.75,
      },
      contract: {
        id: 1,
        notes: '',
        items: [
          {
            id: 1,
            service_id: 5,
            service_name: 'A',
            price: 100,
            price_multiplier: 1,
            percentaje: 0,
            notes: '',
          },
          {
            id: 2,
            service_id: 5,
            service_name: 'B',
            price: 200,
            price_multiplier: 1,
            percentaje: 0,
            notes: '',
          },
        ],
      },
    });

    expect(settings.contract?.items).toHaveLength(1);
    expect(settings.contract?.items[0]!.id).toBe(1);
    expect(settings.contract?.items[0]!.price).toBe(100);
    expect(settings.commissions.loan_multiplier).toBe(1.75);
  });
});

describe('applyContractToLine', () => {
  it('prefills convenio price when newly linked but keeps user edits when already linked', () => {
    const line = quoteLine();
    applyContractToLine(line, contractItem);
    expect(line.unit_cost).toBe(500);
    expect(line.contract_item_id).toBe(10);

    line.unit_cost = 620;
    applyContractToLine(line, contractItem);
    expect(line.unit_cost).toBe(620);
  });
});

describe('findContractItemForService', () => {
  it('returns the contract item for a service_id', () => {
    const settings = mapRescueCompanySettings({
      commissions: {
        commission_type: 'FIXED',
        commission_value: 0,
        commission_fixed: 0,
        price_multiplier: 1,
    loan_multiplier: 1,
      },
      contract: {
        id: 1,
        notes: '',
        items: [
          {
            id: 10,
            service_id: 3,
            service_name: 'Servicio',
            price: 500,
            price_multiplier: 1,
            percentaje: 0,
            notes: '',
          },
        ],
      },
    });

    const item = findContractItemForService(settings, 3);
    expect(item?.id).toBe(10);
    expect(item?.price).toBe(500);
  });
});
