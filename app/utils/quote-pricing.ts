import {
  DEFAULT_IVA_RATE,
  DEFAULT_QUOTE_ROUND_TO_TEN,
  QUOTE_MONEY_DECIMALS,
} from '~/constants/quote-pricing';
import type {
  RescueCompanyCommissions,
  RescueCompanySettings,
} from '~/interfaces/rescue/company-settings';
import { isContractLine } from '~/utils/rescue-company-settings';
import { emptyCatalogDropdownSelection } from '~/interfaces/shared/catalog-dropdown.interface';
import type { RescueQuoteLine, RescueServiceType } from '~/interfaces/rescue';

export interface QuotePricingOptions {
  ivaRate?: number;
  /** Round each filled line total up to the next $10 (default true). */
  roundToTen?: boolean;
  /** When null, seller commission fields are zeroed; price/loan multiplier unchanged. */
  clientSellerId?: number | null;
  /** When `loan`, uses loan_multiplier; otherwise price_multiplier. */
  serviceType?: RescueServiceType | null;
}

export interface QuoteLinePricing {
  line: RescueQuoteLine;
  isContractLine: boolean;
  costSubtotal: number;
  baseFinal: number;
  afterMultiplier: number;
  fixedShare: number;
  /** Seller FIXED commission share embedded in this line (proportional to afterMultiplier). */
  sellerFixedShare: number;
  lineTotalCalculated: number;
  /** Applied price used before line rounding (defaults to calculated). */
  appliedPrice: number;
  /** True when applied price differs from lineTotalCalculated. */
  isAppliedPriceCustom: boolean;
  roundingAdd: number;
  lineTotal: number;
}

export interface QuotePricingSummary {
  costSubtotal: number;
  /** Σ rounded line totals (client-facing before IVA). */
  subtotalLines: number;
  profit: number;
  /** Seller commission (PERCENTAGE from profit or FIXED amount). */
  sellerCommission: number;
  /** @deprecated Alias of sellerCommission */
  commissionValueAdd: number;
  /** Whether seller commission is added to the client-facing total. */
  sellerCommissionAddsToTotal: boolean;
  roundingAddTotal: number;
  /** Σ line totals after per-line applied price + rounding (basis for IVA). */
  totalBeforeTax: number;
  /** True when any filled line has a custom applied price. */
  isAppliedPriceCustom: boolean;
  ivaAmount: number;
  totalCharged: number;
  lines: QuoteLinePricing[];
}

const DEFAULT_COMMISSIONS = {
  commission_type: 'PERCENTAGE' as const,
  commission_value: 0,
  commission_fixed: 0,
  price_multiplier: 1,
  loan_multiplier: 1,
};

const MONEY_FACTOR = 10 ** QUOTE_MONEY_DECIMALS;

/** Active price multiplier for quote lines (loan → loan_multiplier). */
export function resolveQuotePriceMultiplier(
  settings: RescueCompanySettings | null | undefined,
  serviceType?: RescueServiceType | null,
): number {
  const commissions = settings?.commissions ?? DEFAULT_COMMISSIONS;
  if (serviceType === 'loan') {
    return commissions.loan_multiplier;
  }
  return commissions.price_multiplier;
}

export function resolveSellerCommissions(
  settings: RescueCompanySettings | null | undefined,
  clientSellerId?: number | null,
): Pick<
  RescueCompanyCommissions,
  'commission_type' | 'commission_value' | 'commission_fixed'
> {
  const base = settings?.commissions ?? DEFAULT_COMMISSIONS;
  if (clientSellerId === null) {
    return {
      commission_type: 'PERCENTAGE',
      commission_value: 0,
      commission_fixed: 0,
    };
  }
  return {
    commission_type: base.commission_type,
    commission_value: base.commission_value,
    commission_fixed: base.commission_fixed,
  };
}

export function isFilledQuoteLine(
  line: Pick<RescueQuoteLine, 'service'>,
): boolean {
  return line.service.value != null;
}

export function roundQuoteMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * MONEY_FACTOR) / MONEY_FACTOR;
}

export function roundQuoteToNearestTen(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.ceil(value / 10) * 10;
}

function lineBaseFinal(line: Pick<RescueQuoteLine, 'quantity' | 'unit_cost'>): number {
  const qty = Number.isFinite(line.quantity) ? line.quantity : 0;
  const unit = Number.isFinite(line.unit_cost) ? line.unit_cost : 0;
  return qty * unit;
}

function applyLineRounding(
  lineTotalCalculated: number,
  roundToTen: boolean,
): { lineTotal: number; roundingAdd: number } {
  const calculated = roundQuoteMoney(lineTotalCalculated);
  if (!roundToTen) {
    return { lineTotal: calculated, roundingAdd: 0 };
  }
  const lineTotal = roundQuoteToNearestTen(calculated);
  return {
    lineTotal,
    roundingAdd: roundQuoteMoney(lineTotal - calculated),
  };
}

function resolveLineAppliedPrice(
  line: Pick<RescueQuoteLine, 'applied_price'>,
  lineTotalCalculated: number,
): { appliedPrice: number; isAppliedPriceCustom: boolean } {
  const raw = line.applied_price;
  if (raw != null && Number.isFinite(raw) && raw > 0) {
    const appliedPrice = roundQuoteMoney(raw);
    return {
      appliedPrice,
      isAppliedPriceCustom:
        appliedPrice !== roundQuoteMoney(lineTotalCalculated),
    };
  }
  return {
    appliedPrice: lineTotalCalculated,
    isAppliedPriceCustom: false,
  };
}

function emptyLinePricing(line: RescueQuoteLine): QuoteLinePricing {
  return {
    line,
    isContractLine: false,
    costSubtotal: 0,
    baseFinal: 0,
    afterMultiplier: 0,
    fixedShare: 0,
    sellerFixedShare: 0,
    lineTotalCalculated: 0,
    appliedPrice: 0,
    isAppliedPriceCustom: false,
    roundingAdd: 0,
    lineTotal: 0,
  };
}

function computePercentageSellerCommission(
  profit: number,
  commissionValue: number,
): number {
  if (profit <= 0) return 0;
  return roundQuoteMoney(profit * (commissionValue / 100));
}

function distributeRoundedFixedShares(
  standardIndices: number[],
  rowDrafts: Array<{ afterMultiplier: number }>,
  standardAfterMultSum: number,
  commissionFixedPool: number,
): Map<number, number> {
  const shares = new Map<number, number>();
  if (standardIndices.length === 0 || standardAfterMultSum <= 0) {
    return shares;
  }

  const poolRounded = roundQuoteMoney(commissionFixedPool);

  for (const index of standardIndices) {
    const draft = rowDrafts[index]!;
    const raw =
      commissionFixedPool * (draft.afterMultiplier / standardAfterMultSum);
    shares.set(index, roundQuoteMoney(raw));
  }

  const allocated = standardIndices.reduce(
    (sum, index) => sum + (shares.get(index) ?? 0),
    0,
  );
  const remainder = roundQuoteMoney(poolRounded - allocated);

  if (remainder !== 0) {
    const lastStandardIndex = standardIndices[standardIndices.length - 1]!;
    shares.set(
      lastStandardIndex,
      roundQuoteMoney((shares.get(lastStandardIndex) ?? 0) + remainder),
    );
  }

  return shares;
}

export function computeQuotePricing(
  lines: RescueQuoteLine[],
  settings: RescueCompanySettings | null | undefined,
  options: QuotePricingOptions = {},
): QuotePricingSummary {
  const ivaRate = options.ivaRate ?? DEFAULT_IVA_RATE;
  const roundToTen = options.roundToTen ?? DEFAULT_QUOTE_ROUND_TO_TEN;
  const sellerCommissions = resolveSellerCommissions(
    settings,
    options.clientSellerId,
  );
  const priceMultiplier = resolveQuotePriceMultiplier(
    settings,
    options.serviceType,
  );
  const commissionFixedPool = sellerCommissions.commission_fixed;

  const standardIndices: number[] = [];
  const rowDrafts: Array<{
    line: RescueQuoteLine;
    isContractLine: boolean;
    costSubtotal: number;
    baseFinal: number;
    afterMultiplier: number;
  }> = [];

  lines.forEach((line) => {
    if (!isFilledQuoteLine(line)) {
      rowDrafts.push({
        line,
        isContractLine: false,
        costSubtotal: 0,
        baseFinal: 0,
        afterMultiplier: 0,
      });
      return;
    }

    const contractLine = isContractLine(line);
    const costSubtotal = lineBaseFinal(line);
    const baseFinal = costSubtotal;

    if (contractLine) {
      rowDrafts.push({
        line,
        isContractLine: true,
        costSubtotal,
        baseFinal,
        afterMultiplier: baseFinal,
      });
      return;
    }

    const afterMultiplier = baseFinal * priceMultiplier;
    rowDrafts.push({
      line,
      isContractLine: false,
      costSubtotal,
      baseFinal,
      afterMultiplier,
    });
    standardIndices.push(rowDrafts.length - 1);
  });

  const standardAfterMultSum = standardIndices.reduce(
    (sum, index) => sum + rowDrafts[index]!.afterMultiplier,
    0,
  );

  const fixedShareByIndex = distributeRoundedFixedShares(
    standardIndices,
    rowDrafts,
    standardAfterMultSum,
    commissionFixedPool,
  );

  const sellerFixedPool =
    sellerCommissions.commission_type === 'FIXED'
      ? sellerCommissions.commission_value
      : 0;

  const sellerFixedShareByIndex = distributeRoundedFixedShares(
    standardIndices,
    rowDrafts,
    standardAfterMultSum,
    sellerFixedPool,
  );

  const pricingLines: QuoteLinePricing[] = rowDrafts.map((draft, index) => {
    if (!isFilledQuoteLine(draft.line)) {
      return emptyLinePricing(draft.line);
    }

    if (draft.isContractLine) {
      const costSubtotal = roundQuoteMoney(draft.costSubtotal);
      const { appliedPrice, isAppliedPriceCustom } = resolveLineAppliedPrice(
        draft.line,
        costSubtotal,
      );
      const { lineTotal, roundingAdd } = applyLineRounding(
        appliedPrice,
        roundToTen,
      );
      return {
        line: draft.line,
        isContractLine: true,
        costSubtotal,
        baseFinal: costSubtotal,
        afterMultiplier: costSubtotal,
        fixedShare: 0,
        sellerFixedShare: 0,
        lineTotalCalculated: costSubtotal,
        appliedPrice,
        isAppliedPriceCustom,
        roundingAdd,
        lineTotal,
      };
    }

    const costSubtotal = roundQuoteMoney(draft.costSubtotal);
    const baseFinal = roundQuoteMoney(draft.baseFinal);
    const afterMultiplier = roundQuoteMoney(draft.afterMultiplier);
    const fixedShare = fixedShareByIndex.get(index) ?? 0;
    const sellerFixedShare = sellerFixedShareByIndex.get(index) ?? 0;
    const lineTotalCalculated = roundQuoteMoney(
      afterMultiplier + fixedShare + sellerFixedShare,
    );
    const { appliedPrice, isAppliedPriceCustom } = resolveLineAppliedPrice(
      draft.line,
      lineTotalCalculated,
    );
    const { lineTotal, roundingAdd } = applyLineRounding(
      appliedPrice,
      roundToTen,
    );

    return {
      line: draft.line,
      isContractLine: false,
      costSubtotal,
      baseFinal,
      afterMultiplier,
      fixedShare,
      sellerFixedShare,
      lineTotalCalculated,
      appliedPrice,
      isAppliedPriceCustom,
      roundingAdd,
      lineTotal,
    };
  });

  const costSubtotal = pricingLines.reduce((sum, row) => sum + row.costSubtotal, 0);
  const subtotalLines = pricingLines.reduce((sum, row) => sum + row.lineTotal, 0);
  const roundingAddTotal = pricingLines.reduce(
    (sum, row) => sum + row.roundingAdd,
    0,
  );
  const profit = roundQuoteMoney(subtotalLines - costSubtotal);
  const sellerCommission =
    sellerCommissions.commission_type === 'FIXED'
      ? roundQuoteMoney(
          pricingLines.reduce((sum, row) => sum + row.sellerFixedShare, 0),
        )
      : computePercentageSellerCommission(
          profit,
          sellerCommissions.commission_value,
        );
  const sellerCommissionAddsToTotal = false;
  const totalBeforeTax = roundQuoteMoney(subtotalLines);
  const isAppliedPriceCustom = pricingLines.some(
    (row) => row.isAppliedPriceCustom,
  );
  const ivaAmount = roundQuoteMoney(totalBeforeTax * ivaRate);
  const totalCharged = roundQuoteMoney(totalBeforeTax + ivaAmount);

  return {
    costSubtotal,
    subtotalLines,
    profit,
    sellerCommission,
    commissionValueAdd: sellerCommission,
    sellerCommissionAddsToTotal,
    roundingAddTotal,
    totalBeforeTax,
    isAppliedPriceCustom,
    ivaAmount,
    totalCharged,
    lines: pricingLines,
  };
}

/** @deprecated Use computeQuotePricing — kept for gradual migration */
export function computeQuoteLineTotals(
  line: Pick<RescueQuoteLine, 'quantity' | 'unit_cost' | 'contract_item_id' | 'service'>,
  settings?: RescueCompanySettings | null,
  options?: QuotePricingOptions,
): Pick<
  QuoteLinePricing,
  | 'costSubtotal'
  | 'lineTotal'
  | 'lineTotalCalculated'
  | 'roundingAdd'
  | 'isContractLine'
  | 'fixedShare'
  | 'afterMultiplier'
> {
  const fullLine: RescueQuoteLine = {
    id: '',
    service: line.service ?? emptyCatalogDropdownSelection(),
    quantity: line.quantity,
    unit_cost: line.unit_cost,
    contract_item_id: line.contract_item_id ?? null,
    applied_price: 0,
  };
  const summary = computeQuotePricing([fullLine], settings, options);
  const row = summary.lines[0]!;
  return {
    costSubtotal: row.costSubtotal,
    lineTotal: row.lineTotal,
    lineTotalCalculated: row.lineTotalCalculated,
    roundingAdd: row.roundingAdd,
    isContractLine: row.isContractLine,
    fixedShare: row.fixedShare,
    afterMultiplier: row.afterMultiplier,
  };
}

/** @deprecated Use computeQuotePricing */
export function computeQuoteSummary(
  lines: RescueQuoteLine[],
  settings?: RescueCompanySettings | null,
  options?: QuotePricingOptions,
) {
  const pricing = computeQuotePricing(lines, settings, options);
  return {
    costSubtotal: pricing.costSubtotal,
    totalCharged: pricing.totalCharged,
    subtotalLines: pricing.subtotalLines,
    profit: pricing.profit,
    commissionValueAdd: pricing.sellerCommission,
    totalBeforeTax: pricing.totalBeforeTax,
    ivaAmount: pricing.ivaAmount,
    lines: pricing.lines.map((row) => ({
      line: row.line,
      costSubtotal: row.costSubtotal,
      lineTotal: row.lineTotal,
      isContractLine: row.isContractLine,
    })),
  };
}

export function formatQuoteMoney(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: QUOTE_MONEY_DECIMALS,
    maximumFractionDigits: QUOTE_MONEY_DECIMALS,
  }).format(roundQuoteMoney(value));
}

export function formatIvaPercent(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}
