import { describe, expect, it } from 'vitest';
import type { RescueCompanySettings } from '~/interfaces/rescue/company-settings';
import type { RescueQuoteLine } from '~/interfaces/rescue';
import {
  buildRescueQuoteCreateBody,
  buildRescueQuoteUpdateBody,
  formatQuoteDecimal,
} from '~/utils/rescue-quote-create';

function line(
  partial: Partial<RescueQuoteLine> & Pick<RescueQuoteLine, 'quantity' | 'unit_cost'>,
): RescueQuoteLine {
  return {
    id: partial.id ?? crypto.randomUUID(),
    service_id:
      partial.service_id !== undefined ? partial.service_id : 1,
    service_label: partial.service_label ?? 'Servicio',
    quantity: partial.quantity,
    unit_cost: partial.unit_cost,
    contract_item_id: partial.contract_item_id ?? null,
  };
}

function emptyLine(): RescueQuoteLine {
  return {
    id: crypto.randomUUID(),
    service_id: null,
    service_label: '',
    quantity: 0,
    unit_cost: 0,
    contract_item_id: null,
  };
}

const baseSettings: RescueCompanySettings = {
  commissions: {
    commission_type: 'PERCENTAGE',
    commission_value: 5,
    commission_fixed: 500,
    price_multiplier: 1.1,
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

describe('formatQuoteDecimal', () => {
  it('formats amounts as decimal strings with two places', () => {
    expect(formatQuoteDecimal(850)).toBe('850.00');
    expect(formatQuoteDecimal(46.75)).toBe('46.75');
  });
});

describe('buildRescueQuoteCreateBody', () => {
  it('returns null when no filled quote lines', () => {
    expect(buildRescueQuoteCreateBody(1, [emptyLine()], baseSettings)).toBeNull();
    expect(buildRescueQuoteCreateBody(1, [], baseSettings)).toBeNull();
  });

  it('maps header totals and three standard lines', () => {
    const lines = [
      line({ quantity: 1, unit_cost: 500, service_id: 1 }),
      line({ quantity: 1, unit_cost: 300, service_id: 2 }),
      line({ quantity: 1, unit_cost: 200, service_id: 3 }),
    ];

    const body = buildRescueQuoteCreateBody(42, lines, baseSettings, {
      ivaRate: 0,
      roundToTen: false,
    });

    expect(body).not.toBeNull();
    expect(body!.rescue).toBe(42);
    expect(body!.technical_cost).toBe('1000.00');
    expect(body!.sub_total).toBe('1600.00');
    expect(body!.total).toBe('1600.00');
    expect(body!.iva).toBe(16);
    expect(body!.seller_commission_type).toBe('PERCENTAGE');
    expect(body!.seller_commission_value).toBe('5.00');
    expect(body!.seller_commission_fixed).toBe('500.00');
    expect(body!.seller_commission_amount).toBe('30.00');
    expect(body!.comissions_apply).toBe('30.00');
    expect(body!.services).toHaveLength(3);

    const [s0, s1, s2] = body!.services;
    expect(s0!.real_cost).toBe('500.00');
    expect(s0!.pre_total).toBe('800.00');
    expect(s0!.amount_applied).toBe('250.00');
    expect(s0!.percenaje_apply).toBe('50.00');
    expect(s0!.amount_rounded).toBe('0.00');
    expect(s0!.total).toBe('800.00');

    expect(s1!.amount_applied).toBe('150.00');
    expect(s1!.percenaje_apply).toBe('30.00');
    expect(s2!.amount_applied).toBe('100.00');
    expect(s2!.percenaje_apply).toBe('20.00');
  });

  it('maps contract line with zero commission fields', () => {
    const lines = [
      line({
        quantity: 3,
        unit_cost: 500,
        service_id: 1,
        contract_item_id: 10,
      }),
      line({ quantity: 1, unit_cost: 200, service_id: 2 }),
    ];

    const body = buildRescueQuoteCreateBody(7, lines, baseSettings, {
      ivaRate: 0,
      roundToTen: false,
    });

    expect(body!.services).toHaveLength(2);
    expect(body!.seller_commission_type).toBe('PERCENTAGE');
    expect(body!.seller_commission_value).toBe('5.00');
    expect(body!.services[0]!.amount_applied).toBe('0.00');
    expect(body!.services[0]!.percenaje_apply).toBe('0.00');
    expect(body!.services[0]!.total).toBe('1500.00');
    expect(body!.services[1]!.amount_applied).toBe('500.00');
  });

  it('omits comissions_apply when seller commission is zero', () => {
    const settings: RescueCompanySettings = {
      commissions: {
        commission_type: 'PERCENTAGE',
        commission_value: 0,
        commission_fixed: 0,
        price_multiplier: 1,
      },
      contract: null,
    };
    const body = buildRescueQuoteCreateBody(
      1,
      [line({ quantity: 1, unit_cost: 100 })],
      settings,
      { ivaRate: 0, roundToTen: false },
    );

    expect(body!.comissions_apply).toBeUndefined();
    expect(body!.seller_commission_amount).toBe('0.00');
    expect(body!.seller_commission_type).toBe('PERCENTAGE');
    expect(body!.seller_commission_value).toBe('0.00');
    expect(body!.seller_commission_fixed).toBe('0.00');
    expect(body!.sub_total).toBe('100.00');
  });

  it('includes fixed seller commission in comissions_apply and sub_total', () => {
    const settings: RescueCompanySettings = {
      commissions: {
        commission_type: 'FIXED',
        commission_value: 100,
        commission_fixed: 0,
        price_multiplier: 1,
      },
      contract: null,
    };
    const body = buildRescueQuoteCreateBody(
      1,
      [line({ quantity: 1, unit_cost: 1000 })],
      settings,
      { ivaRate: 0, roundToTen: false },
    );

    expect(body!.comissions_apply).toBe('100.00');
    expect(body!.seller_commission_amount).toBe('100.00');
    expect(body!.seller_commission_type).toBe('FIXED');
    expect(body!.seller_commission_value).toBe('100.00');
    expect(body!.seller_commission_fixed).toBe('0.00');
    expect(body!.sub_total).toBe('1100.00');
    expect(body!.total).toBe('1100.00');
  });
});

describe('buildRescueQuoteUpdateBody', () => {
  it('omits rescue field from create body', () => {
    const lines = [
      line({ quantity: 1, unit_cost: 500, service_id: 1 }),
    ];
    const updateBody = buildRescueQuoteUpdateBody(lines, baseSettings, {
      ivaRate: 0,
      roundToTen: false,
    });

    expect(updateBody).not.toBeNull();
    expect(updateBody).not.toHaveProperty('rescue');
    expect(updateBody!.seller_commission_type).toBe('PERCENTAGE');
    expect(updateBody!.seller_commission_value).toBe('5.00');
    expect(updateBody!.seller_commission_fixed).toBe('500.00');
    expect(updateBody!.technical_cost).toBe('500.00');
    expect(updateBody!.services).toHaveLength(1);
  });

  it('returns null when no filled quote lines', () => {
    expect(buildRescueQuoteUpdateBody([emptyLine()], baseSettings)).toBeNull();
  });
});
