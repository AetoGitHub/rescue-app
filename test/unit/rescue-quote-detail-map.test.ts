import { describe, expect, it } from 'vitest';
import type { RescueCompanySettings } from '~/interfaces/rescue/company-settings';
import type { RescueQuoteDetail } from '~/interfaces/rescue/quote';
import { mapRescueQuoteDetailFromApi } from '~/utils/rescue-quote-detail-map';

const baseSettings: RescueCompanySettings = {
  commissions: {
    commission_type: 'PERCENTAGE',
    commission_value: 5,
    commission_fixed: 500,
    price_multiplier: 1.1,
    loan_multiplier: 1,
  },
  contract: {
    id: 1,
    notes: '',
    items: [
      {
        id: 10,
        service_id: 1,
        service_name: 'Grúa plana',
        price: 500,
        price_multiplier: 1,
        percentaje: 0,
        notes: '',
      },
    ],
  },
};

const sampleDetail: RescueQuoteDetail = {
  id: 8,
  rescue_id: 11,
  technical_cost: '500.00',
  sub_total: '850.00',
  total: '986.00',
  comissions_apply: '52.50',
  iva: 16,
  services: [
    {
      id: 9,
      service_id: 1,
      service_name: 'Grúa plana',
      quantity: 1,
      real_cost: '500.00',
      pre_total: '850.00',
      percenaje_apply: '100.00',
      amount_applied: '100.00',
      amount_rounded: '0.00',
      total: '850.00',
    },
    {
      id: 10,
      service_id: 2,
      service_name: 'Maniobra',
      quantity: 2,
      real_cost: '600.00',
      pre_total: '900.00',
      percenaje_apply: '0.00',
      amount_applied: '0.00',
      amount_rounded: '0.00',
      total: '900.00',
    },
  ],
};

describe('mapRescueQuoteDetailFromApi', () => {
  it('maps service fields and derives unit_cost from real_cost / quantity', () => {
    const lines = mapRescueQuoteDetailFromApi(sampleDetail);

    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatchObject({
      service: { value: 1, label: 'Grúa plana' },
      quantity: 1,
      unit_cost: 500,
      applied_price: 850,
    });
    expect(lines[1]).toMatchObject({
      service: { value: 2, label: 'Maniobra' },
      quantity: 2,
      unit_cost: 300,
      applied_price: 900,
    });
  });

  it('prefers service applied_price when present', () => {
    const detail: RescueQuoteDetail = {
      ...sampleDetail,
      services: [
        {
          ...sampleDetail.services[0]!,
          applied_price: '920.50',
          pre_total: '850.00',
          total: '930.00',
        },
      ],
    };

    const lines = mapRescueQuoteDetailFromApi(detail);
    expect(lines[0]!.applied_price).toBe(920.5);
  });

  it('infers contract_item_id when unit cost matches convenio price', () => {
    const lines = mapRescueQuoteDetailFromApi(sampleDetail, baseSettings);

    expect(lines[0]!.contract_item_id).toBe(10);
    expect(lines[1]!.contract_item_id).toBeNull();
  });

  it('generates unique local ids for each line', () => {
    const lines = mapRescueQuoteDetailFromApi(sampleDetail);
    const ids = lines.map((line) => line.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
