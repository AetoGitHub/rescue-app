import { describe, expect, it } from 'vitest';
import type { RescueCompanySettings } from '~/interfaces/rescue/company-settings';
import type { RescueQuoteLine } from '~/interfaces/rescue';
import {
  catalogDropdownSelection,
  emptyCatalogDropdownSelection,
} from '~/interfaces/shared/catalog-dropdown.interface';
import {
  computeQuotePricing,
  roundQuoteMoney,
  roundQuoteToNearestTen,
  type QuotePricingSummary,
} from '~/utils/quote-pricing';

function line(
  partial: Partial<RescueQuoteLine> & Pick<RescueQuoteLine, 'quantity' | 'unit_cost'>,
): RescueQuoteLine {
  return {
    id: partial.id ?? crypto.randomUUID(),
    service: partial.service ?? catalogDropdownSelection(1, 'Servicio'),
    quantity: partial.quantity,
    unit_cost: partial.unit_cost,
    contract_item_id: partial.contract_item_id ?? null,
    applied_price: partial.applied_price ?? 0,
  };
}

function emptyLine(): RescueQuoteLine {
  return {
    id: crypto.randomUUID(),
    service: emptyCatalogDropdownSelection(),
    quantity: 0,
    unit_cost: 0,
    contract_item_id: null,
    applied_price: 0,
  };
}

function expectAtMostTwoDecimals(value: number) {
  expect(value).toBe(roundQuoteMoney(value));
}

function expectAllMoneyRounded(result: QuotePricingSummary) {
  expectAtMostTwoDecimals(result.costSubtotal);
  expectAtMostTwoDecimals(result.subtotalLines);
  expectAtMostTwoDecimals(result.profit);
  expectAtMostTwoDecimals(result.sellerCommission);
  expectAtMostTwoDecimals(result.totalBeforeTax);
  expectAtMostTwoDecimals(result.ivaAmount);
  expectAtMostTwoDecimals(result.totalCharged);
  for (const row of result.lines) {
    expectAtMostTwoDecimals(row.costSubtotal);
    expectAtMostTwoDecimals(row.baseFinal);
    expectAtMostTwoDecimals(row.afterMultiplier);
    expectAtMostTwoDecimals(row.fixedShare);
    expectAtMostTwoDecimals(row.sellerFixedShare);
    expectAtMostTwoDecimals(row.lineTotalCalculated);
    expectAtMostTwoDecimals(row.appliedPrice);
    expectAtMostTwoDecimals(row.roundingAdd);
    expectAtMostTwoDecimals(row.lineTotal);
  }
}

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
      {
        id: 11,
        service_id: 1,
        service_name: 'Grúa plana',
        price: 750,
        price_multiplier: 1.5,
        percentaje: 10,
        notes: 'Premium',
      },
    ],
  },
};

describe('roundQuoteMoney', () => {
  it('rounds to two decimal places (half up)', () => {
    expect(roundQuoteMoney(177.77777777)).toBe(177.78);
    expect(roundQuoteMoney(177.774)).toBe(177.77);
    expect(roundQuoteMoney(1.005)).toBe(1.01);
  });
});

describe('roundQuoteToNearestTen', () => {
  it('rounds up to the next ten pesos (ceil)', () => {
    expect(roundQuoteToNearestTen(171)).toBe(180);
    expect(roundQuoteToNearestTen(994)).toBe(1000);
    expect(roundQuoteToNearestTen(999)).toBe(1000);
    expect(roundQuoteToNearestTen(170)).toBe(170);
    expect(roundQuoteToNearestTen(180)).toBe(180);
  });
});

describe('computeQuotePricing', () => {
  it('does not apply commissions on lines without service', () => {
    const result = computeQuotePricing([emptyLine()], baseSettings, {
      ivaRate: 0,
      roundToTen: false,
    });

    expect(result.lines[0]!.lineTotal).toBe(0);
    expect(result.subtotalLines).toBe(0);
    expect(result.sellerCommission).toBe(0);
    expectAllMoneyRounded(result);
  });

  it('applies multiplier and splits commission_fixed across filled lines only', () => {
    const lines = [
      line({ quantity: 1, unit_cost: 500 }),
      line({ quantity: 1, unit_cost: 300 }),
      line({ quantity: 1, unit_cost: 200 }),
    ];

    const result = computeQuotePricing(lines, baseSettings, {
      ivaRate: 0,
      roundToTen: false,
    });

    expect(result.lines[0]!.lineTotal).toBe(800);
    expect(result.lines[1]!.lineTotal).toBe(480);
    expect(result.lines[2]!.lineTotal).toBe(320);
    expect(result.costSubtotal).toBe(1000);
    expect(result.subtotalLines).toBe(1600);
    expect(result.profit).toBe(600);
    expect(result.sellerCommission).toBe(30);
    expect(result.sellerCommissionAddsToTotal).toBe(false);
    expect(result.totalBeforeTax).toBe(1600);
    expectAllMoneyRounded(result);
  });

  it('computes percentage seller commission from profit without adding to client total', () => {
    const lines = [
      line({ quantity: 1, unit_cost: 1000 }),
      line({ quantity: 1, unit_cost: 1000 }),
      line({ quantity: 1, unit_cost: 1000 }),
    ];
    const settings: RescueCompanySettings = {
      commissions: {
        commission_type: 'PERCENTAGE',
        commission_value: 5,
        commission_fixed: 200,
        price_multiplier: 1.1,
    loan_multiplier: 1,
      },
      contract: null,
    };

    const result = computeQuotePricing(lines, settings, {
      ivaRate: 0,
      roundToTen: false,
    });

    expect(result.costSubtotal).toBe(3000);
    expect(result.subtotalLines).toBe(3500);
    expect(result.profit).toBe(500);
    expect(result.sellerCommission).toBe(25);
    expect(result.totalBeforeTax).toBe(3500);
    expectAllMoneyRounded(result);
  });

  it('skips company commissions for contract lines but includes seller commission on profit', () => {
    const lines = [
      line({
        quantity: 3,
        unit_cost: 500,
        service: catalogDropdownSelection(1),
        contract_item_id: 10,
      }),
      line({ quantity: 1, unit_cost: 200, service: catalogDropdownSelection(2) }),
    ];

    const result = computeQuotePricing(lines, baseSettings, {
      ivaRate: 0,
      roundToTen: false,
    });

    expect(result.lines[0]!.isContractLine).toBe(true);
    expect(result.lines[0]!.lineTotal).toBe(1500);
    expect(result.lines[1]!.afterMultiplier).toBe(220);
    expect(result.lines[1]!.fixedShare).toBe(500);
    expect(result.lines[1]!.lineTotal).toBe(720);
    expect(result.costSubtotal).toBe(1700);
    expect(result.subtotalLines).toBe(2220);
    expect(result.profit).toBe(520);
    expect(result.sellerCommission).toBe(26);
    expect(result.totalBeforeTax).toBe(2220);
    expectAllMoneyRounded(result);
  });

  it('embeds fixed seller commission in line totals (not added at quote level)', () => {
    const lines = [line({ quantity: 1, unit_cost: 1000 })];
    const settings: RescueCompanySettings = {
      commissions: {
        commission_type: 'FIXED',
        commission_value: 100,
        commission_fixed: 0,
        price_multiplier: 1,
    loan_multiplier: 1,
      },
      contract: null,
    };

    const result = computeQuotePricing(lines, settings, { roundToTen: false });

    expect(result.lines[0]!.sellerFixedShare).toBe(100);
    expect(result.lines[0]!.lineTotal).toBe(1100);
    expect(result.subtotalLines).toBe(1100);
    expect(result.profit).toBe(100);
    expect(result.sellerCommission).toBe(100);
    expect(result.sellerCommissionAddsToTotal).toBe(false);
    expect(result.totalBeforeTax).toBe(1100);
    expect(result.ivaAmount).toBe(176);
    expect(result.totalCharged).toBe(1276);
    expectAllMoneyRounded(result);
  });

  it('splits fixed seller commission proportionally across standard lines', () => {
    const lines = [
      line({ quantity: 5, unit_cost: 1500, service: catalogDropdownSelection(1) }),
      line({ quantity: 2, unit_cost: 500, service: catalogDropdownSelection(2) }),
    ];
    const settings: RescueCompanySettings = {
      commissions: {
        commission_type: 'FIXED',
        commission_value: 100,
        commission_fixed: 0,
        price_multiplier: 1,
    loan_multiplier: 1,
      },
      contract: null,
    };

    const result = computeQuotePricing(lines, settings, {
      ivaRate: 0,
      roundToTen: false,
    });

    // afterMult: 7500 vs 1000 (total 8500) → shares ~88.24 / 11.76
    expect(result.lines[0]!.sellerFixedShare).toBe(88.24);
    expect(result.lines[1]!.sellerFixedShare).toBe(11.76);
    expect(result.lines[0]!.lineTotal).toBe(7588.24);
    expect(result.lines[1]!.lineTotal).toBe(1011.76);
    expect(result.subtotalLines).toBe(8600);
    expect(result.sellerCommission).toBe(100);
    expect(result.sellerCommissionAddsToTotal).toBe(false);
    expect(result.totalBeforeTax).toBe(8600);
    expectAllMoneyRounded(result);
  });

  it('embeds both commission_fixed and seller FIXED in line totals', () => {
    const lines = [
      line({ quantity: 1, unit_cost: 500 }),
      line({ quantity: 1, unit_cost: 500 }),
    ];
    const settings: RescueCompanySettings = {
      commissions: {
        commission_type: 'FIXED',
        commission_value: 100,
        commission_fixed: 200,
        price_multiplier: 1,
    loan_multiplier: 1,
      },
      contract: null,
    };

    const result = computeQuotePricing(lines, settings, {
      ivaRate: 0,
      roundToTen: false,
    });

    expect(result.lines[0]!.fixedShare).toBe(100);
    expect(result.lines[1]!.fixedShare).toBe(100);
    expect(result.lines[0]!.sellerFixedShare).toBe(50);
    expect(result.lines[1]!.sellerFixedShare).toBe(50);
    expect(result.lines[0]!.lineTotal).toBe(650);
    expect(result.lines[1]!.lineTotal).toBe(650);
    expect(result.subtotalLines).toBe(1300);
    expect(result.sellerCommission).toBe(100);
    expect(result.totalBeforeTax).toBe(1300);
    expectAllMoneyRounded(result);
  });

  it('does not assign seller FIXED share to contract lines', () => {
    const lines = [
      line({
        quantity: 1,
        unit_cost: 500,
        service: catalogDropdownSelection(1),
        contract_item_id: 10,
      }),
      line({ quantity: 1, unit_cost: 500, service: catalogDropdownSelection(2) }),
    ];
    const settings: RescueCompanySettings = {
      commissions: {
        commission_type: 'FIXED',
        commission_value: 100,
        commission_fixed: 0,
        price_multiplier: 1,
    loan_multiplier: 1,
      },
      contract: baseSettings.contract,
    };

    const result = computeQuotePricing(lines, settings, {
      ivaRate: 0,
      roundToTen: false,
    });

    expect(result.lines[0]!.sellerFixedShare).toBe(0);
    expect(result.lines[1]!.sellerFixedShare).toBe(100);
    expect(result.lines[1]!.lineTotal).toBe(600);
    expect(result.sellerCommission).toBe(100);
    expect(result.totalBeforeTax).toBe(1100);
    expectAllMoneyRounded(result);
  });

  it('returns zero percentage commission when profit is zero or negative', () => {
    const lines = [line({ quantity: 1, unit_cost: 1000 })];
    const settings: RescueCompanySettings = {
      commissions: {
        commission_type: 'PERCENTAGE',
        commission_value: 5,
        commission_fixed: 0,
        price_multiplier: 0.8,
    loan_multiplier: 1,
      },
      contract: null,
    };

    const result = computeQuotePricing(lines, settings, {
      ivaRate: 0,
      roundToTen: false,
    });

    expect(result.subtotalLines).toBe(800);
    expect(result.profit).toBe(-200);
    expect(result.sellerCommission).toBe(0);
    expect(result.totalBeforeTax).toBe(800);
    expectAllMoneyRounded(result);
  });

  it('rounds line total up to next ten and stores rounding_add', () => {
    const lines = [line({ quantity: 1, unit_cost: 999, service: catalogDropdownSelection(1) })];
    const settings: RescueCompanySettings = {
      commissions: {
        commission_type: 'PERCENTAGE',
        commission_value: 0,
        commission_fixed: 0,
        price_multiplier: 1,
    loan_multiplier: 1,
      },
      contract: null,
    };

    const result = computeQuotePricing(lines, settings, {
      ivaRate: 0,
      roundToTen: true,
    });

    expect(result.lines[0]!.lineTotalCalculated).toBe(999);
    expect(result.lines[0]!.lineTotal).toBe(1000);
    expect(result.lines[0]!.roundingAdd).toBe(1);
    expect(result.roundingAddTotal).toBe(1);
    expect(result.subtotalLines).toBe(1000);
    expectAllMoneyRounded(result);
  });

  it('rounds 171 up to 180 with rounding_add 9', () => {
    const lines = [line({ quantity: 1, unit_cost: 171, service: catalogDropdownSelection(1) })];
    const settings: RescueCompanySettings = {
      commissions: {
        commission_type: 'PERCENTAGE',
        commission_value: 0,
        commission_fixed: 0,
        price_multiplier: 1,
    loan_multiplier: 1,
      },
      contract: null,
    };

    const result = computeQuotePricing(lines, settings, {
      ivaRate: 0,
      roundToTen: true,
    });

    expect(result.lines[0]!.lineTotalCalculated).toBe(171);
    expect(result.lines[0]!.lineTotal).toBe(180);
    expect(result.lines[0]!.roundingAdd).toBe(9);
    expect(result.roundingAddTotal).toBe(9);
    expect(result.subtotalLines).toBe(180);
    expectAllMoneyRounded(result);
  });

  it('skips round-to-ten when disabled', () => {
    const lines = [line({ quantity: 1, unit_cost: 999, service: catalogDropdownSelection(1) })];
    const settings: RescueCompanySettings = {
      commissions: {
        commission_type: 'PERCENTAGE',
        commission_value: 0,
        commission_fixed: 0,
        price_multiplier: 1,
    loan_multiplier: 1,
      },
      contract: null,
    };

    const result = computeQuotePricing(lines, settings, {
      ivaRate: 0,
      roundToTen: false,
    });

    expect(result.lines[0]!.lineTotal).toBe(999);
    expect(result.lines[0]!.roundingAdd).toBe(0);
    expectAllMoneyRounded(result);
  });

  it('zeros seller commissions when client has no seller but keeps price multiplier', () => {
    const lines = [
      line({ quantity: 1, unit_cost: 500 }),
      line({ quantity: 1, unit_cost: 300 }),
      line({ quantity: 1, unit_cost: 200 }),
    ];

    const withSeller = computeQuotePricing(lines, baseSettings, {
      ivaRate: 0,
      roundToTen: false,
      clientSellerId: 7,
    });
    const withoutSeller = computeQuotePricing(lines, baseSettings, {
      ivaRate: 0,
      roundToTen: false,
      clientSellerId: null,
    });

    expect(withSeller.subtotalLines).toBe(1600);
    expect(withSeller.sellerCommission).toBe(30);
    expect(withSeller.lines[0]!.fixedShare).toBe(250);

    expect(withoutSeller.subtotalLines).toBe(1100);
    expect(withoutSeller.sellerCommission).toBe(0);
    expect(withoutSeller.lines[0]!.afterMultiplier).toBe(550);
    expect(withoutSeller.lines[0]!.fixedShare).toBe(0);
    expect(withoutSeller.lines[1]!.fixedShare).toBe(0);
    expect(withoutSeller.lines[2]!.fixedShare).toBe(0);
    expectAllMoneyRounded(withoutSeller);
  });

  it('uses per-line applied_price for lineTotal and totalBeforeTax', () => {
    const lines = [
      line({ quantity: 1, unit_cost: 1000, applied_price: 3592.85 }),
    ];
    const calculated = computeQuotePricing(
      [line({ quantity: 1, unit_cost: 1000 })],
      baseSettings,
      {
        ivaRate: 0.16,
        roundToTen: false,
      },
    );

    expect(calculated.subtotalLines).toBe(1600);
    expect(calculated.totalBeforeTax).toBe(1600);
    expect(calculated.isAppliedPriceCustom).toBe(false);
    expect(calculated.lines[0]!.isAppliedPriceCustom).toBe(false);

    const overridden = computeQuotePricing(lines, baseSettings, {
      ivaRate: 0.16,
      roundToTen: false,
    });

    expect(overridden.lines[0]!.lineTotalCalculated).toBe(1600);
    expect(overridden.lines[0]!.appliedPrice).toBe(3592.85);
    expect(overridden.lines[0]!.isAppliedPriceCustom).toBe(true);
    expect(overridden.lines[0]!.lineTotal).toBe(3592.85);
    expect(overridden.subtotalLines).toBe(3592.85);
    expect(overridden.isAppliedPriceCustom).toBe(true);
    expect(overridden.totalBeforeTax).toBe(3592.85);
    expect(overridden.ivaAmount).toBe(574.86);
    expect(overridden.totalCharged).toBe(4167.71);
    expectAllMoneyRounded(overridden);
  });

  it('ceils per-line applied_price to the next $10 when roundToTen', () => {
    const result = computeQuotePricing(
      [line({ quantity: 1, unit_cost: 1000, applied_price: 3592.85 })],
      baseSettings,
      { ivaRate: 0.16, roundToTen: true },
    );

    expect(result.lines[0]!.lineTotal).toBe(3600);
    expect(result.lines[0]!.roundingAdd).toBe(7.15);
    expect(result.totalBeforeTax).toBe(3600);
    expect(result.ivaAmount).toBe(576);
    expect(result.totalCharged).toBe(4176);
  });

  it('uses loan_multiplier when serviceType is loan', () => {
    const settings: RescueCompanySettings = {
      commissions: {
        commission_type: 'PERCENTAGE',
        commission_value: 0,
        commission_fixed: 0,
        price_multiplier: 1.1,
        loan_multiplier: 2,
      },
      contract: null,
    };
    const lines = [line({ quantity: 1, unit_cost: 1000 })];

    const rescuePricing = computeQuotePricing(lines, settings, {
      ivaRate: 0,
      roundToTen: false,
      serviceType: 'rescue',
    });
    const loanPricing = computeQuotePricing(lines, settings, {
      ivaRate: 0,
      roundToTen: false,
      serviceType: 'loan',
    });

    expect(rescuePricing.lines[0]!.afterMultiplier).toBe(1100);
    expect(rescuePricing.subtotalLines).toBe(1100);
    expect(loanPricing.lines[0]!.afterMultiplier).toBe(2000);
    expect(loanPricing.subtotalLines).toBe(2000);
  });
});
